"use client";

import React, { useState } from "react";
import { Message, ToolCall } from "@/types/chat";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Bot, ExternalLink } from "lucide-react";
import { EventTimeline } from "./EventTimeline";
import { EventModal } from "./EventModal";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Check if this is a timeline-only message (no content, only events)
  const isTimelineOnly = !message.content && message.events && message.events.length > 0;

  return (
    <div
      className={cn(
        "flex gap-3 mb-4 animate-slide-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col max-w-[80%] space-y-2",
          isUser && "items-end"
        )}
      >
        {/* Main message content or timeline-only view */}
        {(message.content || (message.events && message.events.length > 0)) && (
          <div
            className={cn(
              "rounded-2xl px-4 pt-2 pb-3 shadow-sm relative",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border"
            )}
          >
            {/* Header: Agent name and external link button */}
            {!isUser && (
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                  {message.author && (
                    <div className="text-[10px] font-semibold text-muted-foreground">
                      {message.author}
                    </div>
                  )}
                  {message.rawEvent && (
                    <button
                      onClick={() => setShowEventModal(true)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      title="View raw event"
                    >
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Event Timeline - displays BEFORE text content */}
            {message.events && message.events.length > 0 && (
              <div className="mb-3">
                <EventTimeline events={message.events} />
              </div>
            )}
            
            {/* Text content - comes AFTER timeline badges */}
            {message.content && (
              <div className={cn(
              "prose prose-sm max-w-none dark:prose-invert",
              isUser && "prose-invert",
              // Enhanced prose styling
              "prose-headings:font-semibold prose-headings:tracking-tight",
              "prose-p:leading-relaxed prose-p:my-2",
              "prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4",
              "prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4",
              "prose-li:my-1",
              "prose-strong:font-bold prose-strong:text-current",
              "prose-code:bg-gray-100 prose-code:dark:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
              "prose-pre:bg-gray-100 prose-pre:dark:bg-gray-800 prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto",
              "prose-a:text-blue-600 prose-a:dark:text-blue-400 prose-a:underline prose-a:hover:text-blue-800",
              "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:dark:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic",
              "prose-table:border-collapse prose-table:w-full",
              "prose-th:border prose-th:border-gray-300 prose-th:dark:border-gray-600 prose-th:px-3 prose-th:py-2 prose-th:bg-gray-100 prose-th:dark:bg-gray-800",
              "prose-td:border prose-td:border-gray-300 prose-td:dark:border-gray-600 prose-td:px-3 prose-td:py-2"
            )}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom renderers for better control
                  p: ({node, ...props}) => <p className="my-2" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="my-1" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-2 mb-1" {...props} />,
                  code: ({node, inline, ...props}) => 
                    inline ? (
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                    ) : (
                      <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto font-mono text-sm" {...props} />
                    ),
                  strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground px-2">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="w-5 h-5 text-primary-foreground" />
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && message.rawEvent && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          event={message.rawEvent}
          eventType="function_response"
        />
      )}
    </div>
  );
}

