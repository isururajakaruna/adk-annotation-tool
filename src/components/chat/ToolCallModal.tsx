'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { ToolCall } from '@/types/chat';
import { Wrench, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolCall: ToolCall;
}

export function ToolCallModal({ isOpen, onClose, toolCall }: ToolCallModalProps) {
  const getStatusDisplay = () => {
    switch (toolCall.status) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          text: 'Success',
          className: 'text-green-600 dark:text-green-400',
          bgClassName: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5" />,
          text: 'Error',
          className: 'text-red-600 dark:text-red-400',
          bgClassName: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        };
      case 'pending':
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          text: 'Running',
          className: 'text-blue-600 dark:text-blue-400',
          bgClassName: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        };
      default:
        return {
          icon: <Clock className="w-5 h-5" />,
          text: 'Unknown',
          className: 'text-gray-600 dark:text-gray-400',
          bgClassName: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header with Tool Name and Status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Wrench className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {toolCall.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Tool Call Details
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border font-medium',
              status.bgClassName,
              status.className
            )}
          >
            {status.icon}
            <span>{status.text}</span>
          </div>
        </div>

        {/* Tool Call ID */}
        {toolCall.id && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold">ID:</span>
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono">
              {toolCall.id}
            </code>
          </div>
        )}

        {/* Arguments Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Arguments
            </h4>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="relative">
            <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-800 font-mono">
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(toolCall.args, null, 2));
              }}
              className="absolute top-2 right-2 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Result Section */}
        {toolCall.result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Result
              </h4>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="relative">
              <pre
                className={cn(
                  'text-sm p-4 rounded-lg overflow-x-auto border font-mono',
                  toolCall.status === 'success'
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                    : toolCall.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                )}
              >
                {typeof toolCall.result === 'string'
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </pre>
              <button
                onClick={() => {
                  const resultText =
                    typeof toolCall.result === 'string'
                      ? toolCall.result
                      : JSON.stringify(toolCall.result, null, 2);
                  navigator.clipboard.writeText(resultText);
                }}
                className="absolute top-2 right-2 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* No Result Message */}
        {!toolCall.result && toolCall.status !== 'pending' && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No result available for this tool call</p>
          </div>
        )}

        {/* Pending Message */}
        {toolCall.status === 'pending' && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tool is currently executing...
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}


