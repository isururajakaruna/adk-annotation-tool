"use client";

import React, { useState } from "react";
import { AgentEvent, ToolResponseEventData } from "@/types/chat";
import { CheckCircle, ExternalLink } from "lucide-react";
import { EventModal } from "./EventModal";

interface ToolResponseBadgeProps {
  event: AgentEvent;
}

export function ToolResponseBadge({ event }: ToolResponseBadgeProps) {
  const [showEventModal, setShowEventModal] = useState(false);
  
  const data = event.data as ToolResponseEventData;

  return (
    <>
      {/* Just the badge - no result display in chat */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium border border-green-200 dark:border-green-800">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>{data.name}</span>
        <button
          onClick={() => setShowEventModal(true)}
          className="p-0.5 hover:bg-green-200 dark:hover:bg-green-800/50 rounded transition-colors ml-1"
          title="View details"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {showEventModal && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          event={event.rawEvent}
          eventType="function_response"
        />
      )}
    </>
  );
}

