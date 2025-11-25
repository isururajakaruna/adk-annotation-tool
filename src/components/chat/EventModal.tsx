"use client";

import React from "react";
import { Modal } from "../ui/Modal";
import { UsageMetadataDisplay } from "./UsageMetadataDisplay";
import { Zap, CheckCircle, Brain } from "lucide-react";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  eventType?: "function_call" | "function_response" | "thinking";
}

export function EventModal({ isOpen, onClose, event, eventType }: EventModalProps) {
  // Extract usage_metadata if it exists
  const usageMetadata = event?.data?.usage_metadata || event?.usage_metadata;

  // Get header based on event type
  const getEventHeader = () => {
    switch (eventType) {
      case "function_call":
        return {
          icon: <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
          title: "Function Call",
          bgColor: "bg-purple-50 dark:bg-purple-900/20",
          borderColor: "border-purple-200 dark:border-purple-800",
        };
      case "function_response":
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
          title: "Function Response",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-800",
        };
      case "thinking":
        return {
          icon: <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          title: "Thinking",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-800",
        };
      default:
        return null;
    }
  };

  const header = getEventHeader();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Event Details">
      <div className="space-y-4">
        {/* Event Type Header */}
        {header && (
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${header.bgColor} ${header.borderColor}`}>
            {header.icon}
            <span className="font-semibold text-sm">{header.title}</span>
          </div>
        )}

        {/* Show usage metadata nicely if present */}
        {usageMetadata && <UsageMetadataDisplay metadata={usageMetadata} />}

        {/* Show full event as plain formatted JSON */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Raw Event Data</h4>
          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded border border-gray-300 dark:border-gray-700 overflow-auto font-mono max-h-96 whitespace-pre">
            {JSON.stringify(event, null, 2)}
          </pre>
        </div>
      </div>
    </Modal>
  );
}

