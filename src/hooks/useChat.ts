/**
 * Custom hook for chat communication using Server-Sent Events (SSE)
 * Communicates with Next.js backend which handles Agent Engine connection
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Message, ChatEvent, ToolCall, Invocation, AgentEvent } from "@/types/chat";
import { generateId } from "@/lib/utils";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [adkSessionId, setAdkSessionId] = useState<string | null>(null);
  const [invocations, setInvocations] = useState<Invocation[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentMessageRef = useRef<Message | null>(null);
  const currentInvocationRef = useRef<{user_message: string; agent_message: string; tool_calls: any[]} | null>(null);
  const thinkingStartTimeRef = useRef<number | null>(null);
  const eventsRef = useRef<AgentEvent[]>([]); // Track events for timeline

  // Initialize session from backend on mount
  useEffect(() => {
    if (!sessionId) {
      // Try to restore session from localStorage first
      const savedSessionId = localStorage.getItem("chatSessionId");
      const savedAdkSessionId = localStorage.getItem("chatAdkSessionId");
      if (savedSessionId && savedAdkSessionId) {
        console.log(`[useChat] 🔄 Restoring session from localStorage:`);
        console.log(`  Frontend ID: ${savedSessionId}`);
        console.log(`  ADK Session: ${savedAdkSessionId}`);
        setSessionId(savedSessionId);
        setAdkSessionId(savedAdkSessionId);
        setIsInitializing(false);
        return;
      }
      
      console.log("[useChat] 🆕 Creating new session from backend...");
      
      fetch("/api/chat/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.sessionId && data.adkSessionId) {
            console.log(`[useChat] ✅ Session initialized:`);
            console.log(`  Frontend ID: ${data.sessionId}`);
            console.log(`  ADK Session: ${data.adkSessionId}`);
            setSessionId(data.sessionId);
            setAdkSessionId(data.adkSessionId);
            // Save both IDs to localStorage for persistence across refreshes
            localStorage.setItem("chatSessionId", data.sessionId);
            localStorage.setItem("chatAdkSessionId", data.adkSessionId);
          } else {
            console.error("[useChat] Failed to get session IDs from backend");
            // Fallback to local generation if backend fails
            const fallbackId = generateId();
            setSessionId(fallbackId);
            localStorage.setItem("chatSessionId", fallbackId);
          }
          setIsInitializing(false);
        })
        .catch((error) => {
          console.error("[useChat] Error initializing session:", error);
          // Fallback to local generation if backend fails
          const fallbackId = generateId();
          setSessionId(fallbackId);
          localStorage.setItem("chatSessionId", fallbackId);
          setIsInitializing(false);
        });
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Ensure we have a session ID before sending
    if (!sessionId) {
      console.error("[useChat] No session ID available yet");
      return;
    }

    console.log("[useChat] Sending message:", content);
    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    
    // Start new invocation
    currentInvocationRef.current = {
      user_message: content,
      agent_message: "",
      tool_calls: [],
    };

    // Initialize assistant message
    currentMessageRef.current = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      toolCalls: [],
      events: [], // Initialize events array
    };
    
    // Reset events for new message
    eventsRef.current = [];

    try {
      console.log(`[useChat] Using session ID: ${sessionId}`);
      
      // Use SSE endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("[useChat] Stream completed");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

          try {
            const jsonData = trimmedLine.substring(6); // Remove "data: " prefix
            const event = JSON.parse(jsonData);

            console.log("[useChat] Received event:", event.type, event);

            switch (event.type) {
              case "text_message":
                // Each text part becomes its own chat bubble
                const textMessage: Message = {
                  id: event.data.id,
                  role: "assistant",
                  content: event.data.content,
                  author: event.data.author,
                  timestamp: event.data.timestamp,
                  events: [], // Text messages don't have timeline events
                  rawEvent: event.data.rawEvent, // Store raw event for modal
                  _custom_original_agent_message: event.data.content, // ALWAYS store original
                };
                
                console.log("[useChat] 💬 Text message from:", event.data.author);
                setMessages((prev) => [...prev, textMessage]);
                
                // If this text had thinking, also add to invocation
                if (currentInvocationRef.current) {
                  currentInvocationRef.current.agent_message += (currentInvocationRef.current.agent_message ? "\n\n" : "") + event.data.content;
                }
                break;

              case "tool_call":
                console.log("[useChat] ⚡ Processing tool_call event:", event.data);
                // Create tool call event for timeline
                const toolCallEvent: AgentEvent = {
                  id: event.data.id,
                  type: 'tool_call',
                  timestamp: Date.now(),
                  data: {
                    id: event.data.id,
                    name: event.data.name,
                    args: event.data.args,
                  },
                  rawEvent: event.data.rawEvent || event,
                };
                
                eventsRef.current.push(toolCallEvent);
                
                // Track in invocation
                if (currentInvocationRef.current) {
                  currentInvocationRef.current.tool_calls.push({
                    name: event.data.name,
                    args: event.data.args,
                  });
                }
                
                // Create or update timeline message
                if (!currentMessageRef.current) {
                  currentMessageRef.current = {
                    id: generateId(),
                    role: "assistant",
                    content: "",
                    timestamp: Date.now(),
                    author: event.data.author,
                    events: [...eventsRef.current],
                  };
                } else {
                  currentMessageRef.current.events = [...eventsRef.current];
                }

                setMessages((prev) => {
                  const filtered = prev.filter(
                    (m) => m.id !== currentMessageRef.current?.id
                  );
                  return [...filtered, { ...currentMessageRef.current! }];
                });
                break;

              case "tool_result":
                console.log("[useChat] ✓ Processing tool_result event:", event.data);
                // Create tool response event for timeline
                const toolResultEvent: AgentEvent = {
                  id: event.data.id || generateId(),
                  type: 'tool_response',
                  timestamp: Date.now(),
                  data: {
                    id: event.data.id,
                    name: event.data.name,
                    result: event.data.result,
                  },
                  rawEvent: event.data.rawEvent || event,
                };
                
                eventsRef.current.push(toolResultEvent);
                
                // Update in invocation
                if (currentInvocationRef.current) {
                  const invToolCall = currentInvocationRef.current.tool_calls.find(
                    (tc: any) => tc.name === event.data.name
                  );
                  if (invToolCall) {
                    invToolCall.result = event.data.result;
                  }
                }
                
                // Create or update timeline message
                if (!currentMessageRef.current) {
                  currentMessageRef.current = {
                    id: generateId(),
                    role: "assistant",
                    content: "",
                    timestamp: Date.now(),
                    author: event.data.author,
                    events: [...eventsRef.current],
                  };
                } else {
                  currentMessageRef.current.events = [...eventsRef.current];
                }

                setMessages((prev) => {
                  const filtered = prev.filter(
                    (m) => m.id !== currentMessageRef.current?.id
                  );
                  return [...filtered, { ...currentMessageRef.current! }];
                });
                break;

              case "thinking":
                console.log("[useChat] 🧠 Processing thinking event:", event.data);
                // Create thinking event for timeline
                const thinkingEvent: AgentEvent = {
                  id: generateId(),
                  type: 'thinking',
                  timestamp: Date.now(),
                  data: {
                    thoughtsTokenCount: event.data.thoughtsTokenCount,
                    totalTokenCount: event.data.totalTokenCount,
                    thoughtSignature: event.data.thoughtSignature,
                  },
                  rawEvent: event.data.rawEvent || event,
                };
                
                eventsRef.current.push(thinkingEvent);
                
                // Create or update timeline message
                if (!currentMessageRef.current) {
                  currentMessageRef.current = {
                    id: generateId(),
                    role: "assistant",
                    content: "",
                    timestamp: Date.now(),
                    author: event.data.author,
                    events: [...eventsRef.current],
                  };
                } else {
                  currentMessageRef.current.events = [...eventsRef.current];
                }

                setMessages((prev) => {
                  const filtered = prev.filter(
                    (m) => m.id !== currentMessageRef.current?.id
                  );
                  return [...filtered, { ...currentMessageRef.current! }];
                });
                break;

              case "done":
                console.log("[useChat] Message completed");
                
                // Save invocation with all accumulated agent messages
                if (currentInvocationRef.current) {
                  const agentMessage = currentInvocationRef.current.agent_message || "";
                  const invocation: Invocation = {
                    invocation_id: generateId(),
                    user_message: currentInvocationRef.current.user_message,
                    agent_message: agentMessage,
                    _custom_original_agent_message: agentMessage, // Store original for comparison
                    timestamp: Date.now(),
                    tool_calls: currentInvocationRef.current.tool_calls,
                  };
                  setInvocations((prev) => [...prev, invocation]);
                }
                
                // Reset refs
                currentMessageRef.current = null;
                currentInvocationRef.current = null;
                thinkingStartTimeRef.current = null;
                eventsRef.current = [];
                setIsLoading(false);
                break;

              case "error":
                console.error("[useChat] Error event:", event.error);
                setError(event.error);
                break;
            }
          } catch (parseError) {
            console.warn("[useChat] Failed to parse event:", trimmedLine, parseError);
          }
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error("[useChat] Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setIsLoading(false);
    }
  }, [isLoading, sessionId]); // Added sessionId to dependency array

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const startNewChat = useCallback(async () => {
    console.log("[useChat] 🆕 Starting new chat...");
    
    // Set initializing state
    setIsInitializing(true);
    
    // Clear current state
    setMessages([]);
    setInvocations([]);
    setError(null);
    eventsRef.current = [];
    
    try {
      // Create new session from backend
      const response = await fetch("/api/chat/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (data.sessionId && data.adkSessionId) {
        console.log(`[useChat] ✅ New session created:`);
        console.log(`  Frontend ID: ${data.sessionId}`);
        console.log(`  ADK Session: ${data.adkSessionId}`);
        setSessionId(data.sessionId);
        setAdkSessionId(data.adkSessionId);
        // Update localStorage with new sessions
        localStorage.setItem("chatSessionId", data.sessionId);
        localStorage.setItem("chatAdkSessionId", data.adkSessionId);
      } else {
        console.error("[useChat] Failed to create new session");
      }
    } catch (error) {
      console.error("[useChat] Error creating new session:", error);
      // Fallback to local generation
      const fallbackId = generateId();
      setSessionId(fallbackId);
      localStorage.setItem("chatSessionId", fallbackId);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Build invocations from messages with annotations
  const getInvocationsForSave = useCallback(() => {
    const invocs: Invocation[] = [];
    let currentUserMessage = "";
    let currentAgentMessage = "";
    let currentToolCalls: any[] = [];
    let currentRating: number | undefined;
    let currentFeedback: string | undefined;
    let currentOriginalAgentMessage = "";
    let currentEvents: AgentEvent[] = [];
    let currentAuthor: string | undefined;
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      if (msg.role === "user") {
        // If we have a pending agent message, save it first
        if (currentAgentMessage && currentOriginalAgentMessage) {
          invocs.push({
            invocation_id: generateId(),
            user_message: currentUserMessage,
            agent_message: currentAgentMessage,
            timestamp: Date.now(),
            tool_calls: currentToolCalls,
            _custom_rating: currentRating,
            _custom_feedback: currentFeedback,
            _custom_original_agent_message: currentOriginalAgentMessage,
            events: currentEvents,
            author: currentAuthor,
          });
        }
        
        // Start new invocation
        currentUserMessage = msg.content;
        currentAgentMessage = "";
        currentToolCalls = [];
        currentRating = undefined;
        currentFeedback = undefined;
        currentOriginalAgentMessage = "";
        currentEvents = [];
        currentAuthor = undefined;
      } else if (msg.role === "assistant") {
        // Collect text content if available
        if (msg.content) {
          currentAgentMessage = msg.content;
          currentRating = msg._custom_rating;
          currentFeedback = msg._custom_feedback;
          currentOriginalAgentMessage = msg._custom_original_agent_message || msg.content;
          currentAuthor = msg.author;
        }
        
        // Collect events (thinking, tool calls, tool responses)
        if (msg.events && msg.events.length > 0) {
          currentEvents = [...currentEvents, ...msg.events];
        }
        
        // Collect tool calls from old format
        if (msg.toolCalls) {
          currentToolCalls = [...currentToolCalls, ...msg.toolCalls];
        }
      }
    }
    
    // Save last invocation if exists
    if (currentUserMessage && (currentAgentMessage || currentEvents.length > 0)) {
      invocs.push({
        invocation_id: generateId(),
        user_message: currentUserMessage,
        agent_message: currentAgentMessage || "",
        timestamp: Date.now(),
        tool_calls: currentToolCalls,
        _custom_rating: currentRating,
        _custom_feedback: currentFeedback,
        _custom_original_agent_message: currentOriginalAgentMessage || currentAgentMessage || "",
        events: currentEvents,
        author: currentAuthor,
      });
    }
    
    return invocs;
  }, [messages]);

  return {
    messages,
    isLoading,
    isInitializing,
    error,
    sessionId,
    adkSessionId,
    invocations,
    sendMessage,
    clearMessages,
    startNewChat,
    getInvocationsForSave,
  };
}

