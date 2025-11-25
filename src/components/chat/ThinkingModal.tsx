"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { ThinkingEventData } from "@/types/chat";
import { Copy, Check } from "lucide-react";

interface ThinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ThinkingEventData;
}

export function ThinkingModal({ isOpen, onClose, data }: ThinkingModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (data.thoughtSignature) {
      await navigator.clipboard.writeText(
        typeof data.thoughtSignature === 'string'
          ? data.thoughtSignature
          : JSON.stringify(data.thoughtSignature, null, 2)
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thinking Details">
      <div className="space-y-4">
        {/* Token counts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Thoughts Tokens</div>
            <div className="text-2xl font-bold font-mono text-blue-900 dark:text-blue-100">
              {data.thoughtsTokenCount?.toLocaleString() || 'N/A'}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Tokens</div>
            <div className="text-2xl font-bold font-mono text-blue-900 dark:text-blue-100">
              {data.totalTokenCount?.toLocaleString() || 'N/A'}
            </div>
          </div>
        </div>

        {/* Thought signature */}
        {data.thoughtSignature && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Thought Signature</h4>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-800/50 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700 overflow-x-auto font-mono break-all whitespace-pre-wrap">
              {typeof data.thoughtSignature === 'string'
                ? data.thoughtSignature
                : JSON.stringify(data.thoughtSignature, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
}

