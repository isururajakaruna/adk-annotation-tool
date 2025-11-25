"use client";

import React, { useState } from "react";
import { AgentEvent, ThinkingEventData } from "@/types/chat";
import { Brain, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { ThinkingModal } from "./ThinkingModal";
import { EventModal } from "./EventModal";

interface ThinkingBadgeProps {
  event: AgentEvent;
}

export function ThinkingBadge({ event }: ThinkingBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showThinkingModal, setShowThinkingModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  
  const data = event.data as ThinkingEventData;
  const totalTokens = data.totalTokenCount;

  return (
    <>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
        {/* Badge header - always visible */}
        <div className="flex items-center justify-between p-3">
          <button
            onClick={() => setShowThinkingModal(true)}
            className="flex items-center gap-2 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
          >
            <Brain className="w-4 h-4" />
            <span className="font-medium text-sm">Thinking</span>
            {totalTokens && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-800/50 rounded-full">
                {totalTokens.toLocaleString()} tokens
              </span>
            )}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEventModal(true)}
              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded transition-colors"
              title="View details"
            >
              <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded content - NO reasoning text, just token breakdown */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-0 border-t border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-2 gap-2 mt-3">
              {data.thoughtsTokenCount !== undefined && (
                <div className="bg-white dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400">Thoughts</div>
                  <div className="text-sm font-mono font-bold text-blue-900 dark:text-blue-100">
                    {data.thoughtsTokenCount.toLocaleString()}
                  </div>
                </div>
              )}
              {data.totalTokenCount !== undefined && (
                <div className="bg-white dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400">Total</div>
                  <div className="text-sm font-mono font-bold text-blue-900 dark:text-blue-100">
                    {data.totalTokenCount.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showThinkingModal && (
        <ThinkingModal
          isOpen={showThinkingModal}
          onClose={() => setShowThinkingModal(false)}
          data={data}
        />
      )}
      {showEventModal && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          event={event.rawEvent}
          eventType="thinking"
        />
      )}
    </>
  );
}

