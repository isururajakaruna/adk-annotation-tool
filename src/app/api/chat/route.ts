/**
 * WebSocket Chat API Route
 * Handles WebSocket connections from the frontend and communicates with Agent Engine via HTTP SSE
 */

import { NextRequest } from "next/server";
import { WebSocket, WebSocketServer } from "ws";
import { getAgentEngineClient } from "@/lib/agentEngineClient";
import { ChatEvent, Message, ToolCall } from "@/types/chat";
import { generateId } from "@/lib/utils";
import { getSessionLogger } from "@/lib/logger";

// WebSocket server instance
let wss: WebSocketServer | null = null;

// Initialize WebSocket server if not already initialized
function getWebSocketServer(): WebSocketServer {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
    console.log("[WebSocket] Server initialized");
  }
  return wss;
}

// Store mapping of frontend sessionId to ADK session ID
const sessionMap = new Map<string, string>();

/**
 * Get or create an ADK session for the given frontend session ID
 */
async function getOrCreateAdkSession(frontendSessionId: string): Promise<string> {
  // Check if we already have an ADK session for this frontend session
  let adkSessionId = sessionMap.get(frontendSessionId);
  
  if (adkSessionId) {
    console.log(`[API] Using existing ADK session: ${adkSessionId} for frontend session: ${frontendSessionId}`);
    return adkSessionId;
  }
  
  // Create a new ADK session
  const agentClient = getAgentEngineClient();
  adkSessionId = await agentClient.createSession(frontendSessionId);
  
  // Store the mapping
  sessionMap.set(frontendSessionId, adkSessionId);
  console.log(`[API] Created new ADK session: ${adkSessionId} for frontend session: ${frontendSessionId}`);
  
  return adkSessionId;
}

/**
 * Process Agent Engine events and convert to chat events
 */
async function processAgentEngineStream(
  message: string,
  sessionId: string,
  ws: WebSocket
) {
  console.log(`[WebSocket] Processing message: "${message.substring(0, 100)}..."`);
  console.log(`[WebSocket] Using frontend session ID: ${sessionId}`);
  
  const agentClient = getAgentEngineClient();
  
  try {
    // Send initial acknowledgment
    ws.send(JSON.stringify({
      type: "connected",
      timestamp: Date.now(),
    }));

    // Get or create ADK session
    const adkSessionId = await getOrCreateAdkSession(sessionId);
    console.log(`[WebSocket] Using ADK session ID: ${adkSessionId}`);

    let currentMessageId = generateId();
    let accumulatedText = "";
    let currentToolCalls: ToolCall[] = [];

    // Pass both ADK session ID and user ID to maintain conversation context
    for await (const event of agentClient.streamQuery(message, adkSessionId, sessionId)) {
      console.log("[WebSocket] Processing event from Agent Engine");

      // Check if event has content
      if (event.content && event.content.parts) {
        for (const part of event.content.parts) {
          // Handle text content
          if (part.text) {
            accumulatedText += part.text;
            
            const chatEvent: ChatEvent = {
              type: "message",
              data: {
                id: currentMessageId,
                role: "assistant",
                content: accumulatedText,
                timestamp: Date.now(),
              },
              timestamp: Date.now(),
            };

            ws.send(JSON.stringify({
              type: "chat_event",
              event: chatEvent,
            }));
          }

          // Handle function/tool calls
          if (part.function_call) {
            const toolCall: ToolCall = {
              id: part.function_call.id || generateId(),
              name: part.function_call.name,
              args: part.function_call.args,
              status: "pending",
            };

            currentToolCalls.push(toolCall);

            const toolCallEvent: ChatEvent = {
              type: "tool_call",
              data: toolCall,
              timestamp: Date.now(),
            };

            ws.send(JSON.stringify({
              type: "chat_event",
              event: toolCallEvent,
            }));
          }

          // Handle function/tool responses
          if (part.function_response) {
            const toolResultEvent: ChatEvent = {
              type: "tool_result",
              data: {
                id: part.function_response.id || generateId(),
                name: part.function_response.name,
                result: part.function_response.response,
                status: "success",
              },
              timestamp: Date.now(),
            };

            ws.send(JSON.stringify({
              type: "chat_event",
              event: toolResultEvent,
            }));
          }

          // Handle thinking/reasoning (thought_signature)
          if (part.thought_signature) {
            const thinkingEvent: ChatEvent = {
              type: "thinking",
              data: {
                text: part.text || "Processing...",
              },
              timestamp: Date.now(),
            };

            ws.send(JSON.stringify({
              type: "chat_event",
              event: thinkingEvent,
            }));
          }
        }
      }
    }

    // Send completion event
    ws.send(JSON.stringify({
      type: "chat_event",
      event: {
        type: "done",
        data: { messageId: currentMessageId },
        timestamp: Date.now(),
      },
    }));

    console.log("[WebSocket] Stream completed successfully");
  } catch (error) {
    console.error("[WebSocket] Error processing stream:", error);
    
    ws.send(JSON.stringify({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }));
  }
}

/**
 * Handle incoming WebSocket messages
 */
function handleWebSocketMessage(ws: WebSocket, data: any) {
  try {
    const message = JSON.parse(data.toString());
    console.log("[WebSocket] Received message:", message.type);

    switch (message.type) {
      case "user_message":
        const userMessage = message.payload?.message || "";
        const sessionId = message.payload?.sessionId || generateId();
        
        if (userMessage) {
          processAgentEngineStream(userMessage, sessionId, ws);
        } else {
          ws.send(JSON.stringify({
            type: "error",
            error: "No message provided",
          }));
        }
        break;

      case "ping":
        ws.send(JSON.stringify({ type: "pong" }));
        break;

      default:
        console.warn("[WebSocket] Unknown message type:", message.type);
    }
  } catch (error) {
    console.error("[WebSocket] Error handling message:", error);
    ws.send(JSON.stringify({
      type: "error",
      error: "Invalid message format",
    }));
  }
}

/**
 * Handle WebSocket upgrade requests
 * Note: This is a simplified implementation. In production, you might want to use
 * a proper WebSocket library or deploy this as a separate service.
 */
export async function GET(req: NextRequest) {
  try {
    const wss = getWebSocketServer();

    // For Next.js, we need to use a different approach
    // This is a placeholder response - in production, you'd need to handle
    // WebSocket upgrades properly or use a separate WebSocket server
    
    return new Response(
      JSON.stringify({
        error: "WebSocket connection should be established through the /ws endpoint",
        note: "This endpoint is for WebSocket upgrade only",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[WebSocket] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * HTTP POST endpoint for chat (non-WebSocket fallback)
 * This provides a Server-Sent Events (SSE) endpoint as fallback
 */
export async function POST(req: NextRequest) {
  console.log("[API] POST request received");
  
  try {
    const body = await req.json();
    const message = body.message || "";
    const sessionId = body.sessionId || generateId();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "No message provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[API] Processing message: "${message.substring(0, 100)}..."`);
    console.log(`[API] Session ID: ${sessionId} (used as Agent Engine user_id for context)`);

    // Initialize session logger
    const logger = getSessionLogger(sessionId);
    logger.log('API_REQUEST', 'Received chat request', { message, sessionId, note: 'sessionId is used as user_id for Agent Engine' });

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const agentClient = getAgentEngineClient();

        try {
          const messageId = generateId();
          let eventCounter = 0;

          logger.log('STREAM_START', 'Starting Agent Engine stream', { messageId });

          // Get or create ADK session for the frontend session
          const adkSessionId = await getOrCreateAdkSession(sessionId);
          console.log(`[API] ⚡ Using ADK session: ${adkSessionId} for frontend session: ${sessionId}`);
          
          for await (const rawEvent of agentClient.streamQuery(message, adkSessionId, sessionId)) {
            eventCounter++;
            logger.logAgentEngineRawEvent({ eventNumber: eventCounter, rawEvent });
            
            console.log(`[API] Raw event #${eventCounter}:`, JSON.stringify(rawEvent, null, 2));

            // Extract metadata from top level
            const usageMetadata = (rawEvent as any).usage_metadata;
            const author = (rawEvent as any).author; // Extract agent/author name

            // Check all possible event structures
            if (rawEvent.content && rawEvent.content.parts) {
              for (const part of rawEvent.content.parts) {
                logger.log('PART_ANALYSIS', 'Analyzing part', { 
                  hasText: !!part.text,
                  hasFunctionCall: !!part.function_call,
                  hasFunctionResponse: !!part.function_response,
                  hasThoughtSignature: !!part.thought_signature,
                  author,
                  partKeys: Object.keys(part),
                });

                // Handle function/tool calls first (⚡ badge)
                if (part.function_call) {
                  const toolCallEvent = {
                    type: "tool_call",
                    data: {
                      id: part.function_call.id || generateId(),
                      name: part.function_call.name,
                      args: part.function_call.args,
                      author: author,
                      rawEvent: rawEvent, // Include full event for modal
                    },
                  };
                  
                  logger.logParsedEvent('tool_call', toolCallEvent);
                  console.log('[API] ⚡ Tool call detected:', part.function_call.name);
                  
                  const sseEvent = `data: ${JSON.stringify(toolCallEvent)}\n\n`;
                  controller.enqueue(encoder.encode(sseEvent));
                  logger.logSSESent(toolCallEvent);
                }

                // Handle function/tool responses (✓ badge)
                if (part.function_response) {
                  const toolResultEvent = {
                    type: "tool_result",
                    data: {
                      id: part.function_response.id || generateId(),
                      name: part.function_response.name,
                      result: part.function_response.response,
                      author: author,
                      rawEvent: rawEvent, // Include full event for modal
                    },
                  };
                  
                  logger.logParsedEvent('tool_result', toolResultEvent);
                  console.log('[API] ✓ Tool result detected:', part.function_response.name);
                  
                  const sseEvent = `data: ${JSON.stringify(toolResultEvent)}\n\n`;
                  controller.enqueue(encoder.encode(sseEvent));
                  logger.logSSESent(toolResultEvent);
                }

                // Handle thinking (🧠 badge) - only if there's thought_signature without text
                if (part.thought_signature && !part.text) {
                  const thinkingEvent = {
                    type: "thinking",
                    data: {
                      thoughtsTokenCount: usageMetadata?.thoughts_token_count,
                      totalTokenCount: usageMetadata?.total_token_count,
                      thoughtSignature: part.thought_signature,
                      author: author,
                      rawEvent: rawEvent, // Include full event for modal
                    },
                  };
                  
                  logger.logParsedEvent('thinking', thinkingEvent);
                  console.log('[API] 🧠 Thinking detected');
                  
                  const sseEvent = `data: ${JSON.stringify(thinkingEvent)}\n\n`;
                  controller.enqueue(encoder.encode(sseEvent));
                  logger.logSSESent(thinkingEvent);
                }

                // Handle text content (Chat Bubble) - send as separate message
                if (part.text) {
                  const textEvent = {
                    type: "text_message",
                    data: {
                      id: generateId(),
                      content: part.text,
                      author: author,
                      hasThinking: !!part.thought_signature, // Indicate if this had thinking
                      thoughtsTokenCount: usageMetadata?.thoughts_token_count,
                      totalTokenCount: usageMetadata?.total_token_count,
                      thoughtSignature: part.thought_signature,
                      timestamp: Date.now(),
                      rawEvent: rawEvent, // Include full event for modal
                    },
                  };
                  
                  logger.logParsedEvent('text_message', textEvent);
                  console.log('[API] 💬 Text message from:', author);
                  
                  const sseEvent = `data: ${JSON.stringify(textEvent)}\n\n`;
                  controller.enqueue(encoder.encode(sseEvent));
                  logger.logSSESent(textEvent);
                }
              }
            }
          }

          logger.log('STREAM_COMPLETE', 'Agent Engine stream completed', { 
            totalEvents: eventCounter,
            messageId 
          });

          // Send completion
          const doneEvent = {
            type: "done",
            data: { messageId },
          };
          
          logger.logParsedEvent('done', doneEvent);
          
          const sseEvent = `data: ${JSON.stringify(doneEvent)}\n\n`;
          controller.enqueue(encoder.encode(sseEvent));
          logger.logSSESent(doneEvent);

          controller.close();
          logger.complete();
        } catch (error) {
          console.error("[API] Stream error:", error);
          logger.logError('STREAM', error);
          
          const errorEvent = {
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          };
          
          const sseEvent = `data: ${JSON.stringify(errorEvent)}\n\n`;
          controller.enqueue(encoder.encode(sseEvent));
          controller.close();
          logger.complete();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[API] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

