"use client";

import React, { useState } from "react";
import { AgentEvent, ToolCallEventData } from "@/types/chat";
import { Zap, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { EventModal } from "./EventModal";

interface ToolCallBadgeProps {
  event: AgentEvent;
}

export function ToolCallBadge({ event }: ToolCallBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  
  const data = event.data as ToolCallEventData;

  return (
    <>
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Zap className="w-4 h-4" />
            <span className="font-medium text-sm">{data.name}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEventModal(true)}
              className="p-1 hover:bg-purple-100 dark:hover:bg-purple-800/50 rounded transition-colors"
              title="View details"
            >
              <ExternalLink className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-purple-100 dark:hover:bg-purple-800/50 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="px-3 pb-3 pt-0 border-t border-purple-200 dark:border-purple-800">
            <div className="mt-3">
              <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">Arguments</div>
              <pre className="text-xs bg-white dark:bg-purple-950/30 p-3 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto font-mono">
                {JSON.stringify(data.args, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {showEventModal && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          event={event.rawEvent}
          eventType="function_call"
        />
      )}
    </>
  );
}

