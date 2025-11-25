'use client';

import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronRight, Zap, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThinkingCardProps {
  thinking?: string;
  thinkingTokens?: {
    thoughtsTokenCount?: number;
    totalTokenCount?: number;
  };
  thinkingStartTime?: number;
  thinkingEndTime?: number;
  thoughtSignature?: any;
}

export function ThinkingCard({
  thinking,
  thinkingTokens,
  thinkingStartTime,
  thinkingEndTime,
  thoughtSignature,
}: ThinkingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calculate duration
  const duration = thinkingStartTime && thinkingEndTime 
    ? ((thinkingEndTime - thinkingStartTime) / 1000).toFixed(2)
    : null;
  
  // Calculate ongoing duration if thinking hasn't ended yet
  const ongoingDuration = thinkingStartTime && !thinkingEndTime
    ? ((Date.now() - thinkingStartTime) / 1000).toFixed(2)
    : null;

  const thoughtsCount = thinkingTokens?.thoughtsTokenCount;
  const totalCount = thinkingTokens?.totalTokenCount;

  const handleCopySignature = async () => {
    const textToCopy = typeof thoughtSignature === 'string' 
      ? thoughtSignature 
      : JSON.stringify(thoughtSignature, null, 2);
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="w-full rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 overflow-hidden">
      {/* Header - Always visible with token counts */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Thinking
            </span>
          </div>

          {/* Token counts - Prominent display */}
          {(thoughtsCount !== undefined || totalCount !== undefined) && (
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-800/50 border border-blue-300 dark:border-blue-700">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-mono font-semibold text-blue-800 dark:text-blue-200">
                    {thoughtsCount !== undefined ? thoughtsCount : '?'} / {totalCount !== undefined ? totalCount : '?'}
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">tokens</span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Expand/collapse icon */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-600 dark:text-blue-400">
            {isExpanded ? 'Hide details' : 'Show details'}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-blue-200 dark:border-blue-700 p-4 space-y-4 bg-white dark:bg-blue-950/30">
          {/* Thinking text */}
          {thinking && (
            <div>
              <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">
                Reasoning
              </h4>
              <div className="text-sm text-blue-900 dark:text-blue-100 bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                {thinking}
              </div>
            </div>
          )}

          {/* Token details */}
          {(thoughtsCount !== undefined || totalCount !== undefined) && (
            <div>
              <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">
                Token Usage
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Thoughts Tokens</div>
                  <div className="text-lg font-bold font-mono text-blue-900 dark:text-blue-100">
                    {thoughtsCount !== undefined ? thoughtsCount.toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Tokens</div>
                  <div className="text-lg font-bold font-mono text-blue-900 dark:text-blue-100">
                    {totalCount !== undefined ? totalCount.toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Thought signature - if available */}
          {thoughtSignature && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  Thought Signature
                </h4>
                <button
                  onClick={handleCopySignature}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-800/50 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded transition-colors"
                  title="Copy signature"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800 overflow-x-auto font-mono text-blue-900 dark:text-blue-100 break-all">
                {typeof thoughtSignature === 'string' 
                  ? thoughtSignature 
                  : JSON.stringify(thoughtSignature, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

