'use client';

import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface ToolCallBadgeProps {
  toolName: string;
  args: any;
  result?: any;
}

export function ToolCallBadge({ toolName, args, result }: ToolCallBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="inline-block">
      {/* Badge Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium border border-purple-200 dark:border-purple-800"
      >
        <Wrench size={14} />
        <span>{toolName}</span>
        {isExpanded ? (
          <ChevronDown size={14} />
        ) : (
          <ChevronRight size={14} />
        )}
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <Card className="mt-2 animate-fade-in">
          <CardContent className="p-4">
            {/* Tool Name Header */}
            <div className="flex items-center gap-2 mb-3">
              <Wrench size={16} className="text-purple-600 dark:text-purple-400" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {toolName}
              </h4>
            </div>

            {/* Arguments */}
            <div className="mb-3">
              <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                Arguments:
              </h5>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto border border-gray-200 dark:border-gray-700">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>

            {/* Result */}
            {result && (
              <div>
                <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  Result:
                </h5>
                <pre className="text-xs bg-green-50 dark:bg-green-900/20 p-3 rounded overflow-x-auto border border-green-200 dark:border-green-800 text-gray-900 dark:text-gray-100">
                  {typeof result === 'string'
                    ? result
                    : JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


