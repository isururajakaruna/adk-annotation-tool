"use client";

import React, { useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { AlertCircle } from "lucide-react";

interface ChatInterfaceProps {
  onSessionUpdate?: (sessionId: string | null, invocations: any[]) => void;
  onNewChatReady?: (newChatHandler: () => void) => void;
}

export function ChatInterface({ onSessionUpdate, onNewChatReady }: ChatInterfaceProps = {}) {
  const { messages, isLoading, isInitializing, error, sessionId, adkSessionId, invocations, sendMessage, startNewChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationStarted = messages.length > 0 || isLoading;

  // Notify parent of session updates
  useEffect(() => {
    if (onSessionUpdate) {
      onSessionUpdate(sessionId, adkSessionId, invocations);
    }
  }, [sessionId, adkSessionId, invocations, onSessionUpdate]);

  // Expose startNewChat to parent
  useEffect(() => {
    if (onNewChatReady && startNewChat) {
      onNewChatReady(startNewChat);
    }
  }, [onNewChatReady, startNewChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Show loading screen while initializing session
  if (isInitializing) {
    return (
      <div className="flex flex-col h-full max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Initializing Session...
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Creating your conversation session with the agent
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      {/* Messages area - scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Empty state */}
        {!conversationStarted && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-semibold text-gray-700 dark:text-gray-300">
                How can I help you today?
              </h2>
              <p className="text-base text-gray-500 dark:text-gray-400">
                Start by typing a message below
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Thinking indicator */}
          {isLoading && <ThinkingIndicator message="Agent is thinking" />}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - fixed at bottom */}
      <div className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto">
          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}

