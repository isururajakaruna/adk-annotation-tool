"use client";

import React, { useState } from "react";
import { Message, ToolCall } from "@/types/chat";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Bot, ExternalLink, Star, MessageSquare, Edit } from "lucide-react";
import { EventTimeline } from "./EventTimeline";
import { EventModal } from "./EventModal";
import ReactDiffViewer from "react-diff-viewer-continued";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [showEventModal, setShowEventModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [rating, setRating] = useState(message._custom_rating);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState(message._custom_feedback || '');
  const [showDiff, setShowDiff] = useState(false);
  
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
          "flex flex-col space-y-2",
          !isEditing && "max-w-[80%]", // Only constrain width when not editing
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
              <>
                {isEditing ? (
                  <div className="space-y-2 w-full min-w-[700px]">
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full min-h-[200px] p-3 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                      placeholder="Edit the response..."
                      rows={Math.max(8, editedContent.split('\n').length)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Update message content but keep the original
                          message.content = editedContent;
                          // _custom_original_agent_message is already set and should NOT be changed
                          setIsEditing(false);
                        }}
                        className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditedContent(message.content);
                          setIsEditing(false);
                        }}
                        className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Show diff toggle if content was edited */}
                    {message._custom_original_agent_message && 
                     message.content !== message._custom_original_agent_message && (
                      <div className="mb-2">
                        <button
                          onClick={() => setShowDiff(!showDiff)}
                          className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                        >
                          {showDiff ? '👁️ Hide Changes' : '🔍 Show Changes'}
                        </button>
                      </div>
                    )}

                    {/* Show diff view or normal markdown */}
                    {showDiff && message._custom_original_agent_message ? (
                      <div className="border rounded-lg overflow-hidden text-xs">
                        <ReactDiffViewer
                          oldValue={message._custom_original_agent_message}
                          newValue={message.content}
                          splitView={false}
                          showDiffOnly={false}
                          useDarkTheme={false}
                          hideLineNumbers={true}
                          styles={{
                            variables: {
                              light: {
                                diffViewerBackground: '#ffffff',
                                addedBackground: '#e6ffed',
                                addedColor: '#24292e',
                                removedBackground: '#ffeef0',
                                removedColor: '#24292e',
                                wordAddedBackground: '#acf2bd',
                                wordRemovedBackground: '#fdb8c0',
                              },
                              dark: {
                                diffViewerBackground: '#1f2937',
                                addedBackground: '#064e3b',
                                addedColor: '#d1fae5',
                                removedBackground: '#7f1d1d',
                                removedColor: '#fee2e2',
                                wordAddedBackground: '#065f46',
                                wordRemovedBackground: '#991b1b',
                              },
                            },
                          }}
                        />
                      </div>
                    ) : (
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
                        "prose-code:bg-gray-100 prose-code:dark:bg-black prose-code:dark:text-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
                        "prose-pre:bg-gray-100 prose-pre:dark:bg-black prose-pre:dark:text-gray-100 prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto",
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
                            pre: ({node, ...props}) => (
                              <pre className="bg-gray-100 dark:bg-black dark:text-gray-100 p-3 rounded-lg overflow-x-auto my-2" {...props} />
                            ),
                            code: ({node, inline, ...props}) => 
                              inline ? (
                                <code className="bg-gray-100 dark:bg-black dark:text-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                              ) : (
                                <code className="font-mono text-sm" {...props} />
                              ),
                            strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                            em: ({node, ...props}) => <em className="italic" {...props} />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            
            {/* Inline annotations for assistant messages */}
            {!isUser && message.content && (
              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                {/* Show edited indicator if content was modified */}
                {message._custom_original_agent_message && message.content !== message._custom_original_agent_message && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Edit className="w-3 h-3" />
                    <span>Response edited</span>
                  </div>
                )}
                
                {/* Rating and action buttons */}
                <div className="flex items-center justify-between">
                  {/* 5-star rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = rating && star <= rating;
                      const isHovered = hoveredStar !== null && star <= hoveredStar;
                      
                      return (
                        <button
                          key={star}
                          onClick={() => {
                            message._custom_rating = star;
                            setRating(star);
                          }}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(null)}
                          className="p-1 transition-colors"
                        >
                          <Star
                            className={cn(
                              "w-4 h-4",
                              (isActive || isHovered)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowComment(!showComment)}
                      className={cn(
                        "p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                        showComment && "bg-gray-100 dark:bg-gray-800"
                      )}
                      title="Add comment"
                    >
                      <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Edit response"
                    >
                      <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
                
                {/* Comment input */}
                {showComment && (
                  <div className="space-y-2">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add your feedback..."
                      className="w-full min-h-[80px] p-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          message._custom_feedback = comment;
                          setShowComment(false);
                        }}
                        className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90"
                      >
                        Save Comment
                      </button>
                      <button
                        onClick={() => {
                          setComment(message._custom_feedback || '');
                          setShowComment(false);
                        }}
                        className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Display saved comment */}
                {!showComment && message._custom_feedback && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">Your Feedback:</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{message._custom_feedback}</p>
                      </div>
                    </div>
                  </div>
                )}
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

