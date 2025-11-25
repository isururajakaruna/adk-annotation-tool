"use client";

import React from "react";
import { AgentEvent } from "@/types/chat";
import { ThinkingBadge } from "./ThinkingBadge";
import { ToolCallBadge } from "./ToolCallBadge";
import { ToolResponseBadge } from "./ToolResponseBadge";

interface EventTimelineProps {
  events: AgentEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  if (!events || events.length === 0) return null;

  // Calculate relative times from first event
  const startTime = events[0]?.timestamp || 0;
  const getRelativeTime = (timestamp: number) => {
    const diff = timestamp - startTime;
    return (diff / 1000).toFixed(1); // Convert to seconds with 1 decimal
  };

  return (
    <div className="relative pl-16 space-y-3 mb-3">
      {/* Vertical timeline line */}
      <div className="absolute left-12 top-2 bottom-2 w-0.5 bg-gray-300 dark:bg-gray-600" />

      {events.map((event, index) => (
        <div key={event.id} className="relative">
          {/* Relative timestamp */}
          <div className="absolute left-[-62px] top-3 text-xs text-muted-foreground font-mono w-10 text-right">
            {getRelativeTime(event.timestamp)}s
          </div>

          {/* Timeline dot */}
          <div className="absolute left-[-12px] top-3 w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 border-2 border-white dark:border-gray-900" />

          {/* Event badge */}
          {event.type === 'thinking' && (
            <ThinkingBadge event={event} />
          )}
          {event.type === 'tool_call' && (
            <ToolCallBadge event={event} />
          )}
          {event.type === 'tool_response' && (
            <ToolResponseBadge event={event} />
          )}
        </div>
      ))}
    </div>
  );
}

