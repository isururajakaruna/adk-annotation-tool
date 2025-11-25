"use client";

import React from "react";

interface UsageMetadataDisplayProps {
  metadata: any;
}

export function UsageMetadataDisplay({ metadata }: UsageMetadataDisplayProps) {
  if (!metadata) return null;

  const {
    thoughts_token_count,
    total_token_count,
    prompt_token_count,
    candidates_token_count,
    cached_content_token_count,
    traffic_type,
  } = metadata;

  return (
    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
        Usage Metadata
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {thoughts_token_count !== undefined && (
          <div className="bg-white dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-600 dark:text-blue-400">Thoughts Tokens</div>
            <div className="text-lg font-bold font-mono text-blue-900 dark:text-blue-100">
              {thoughts_token_count.toLocaleString()}
            </div>
          </div>
        )}
        {total_token_count !== undefined && (
          <div className="bg-white dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-600 dark:text-blue-400">Total Tokens</div>
            <div className="text-lg font-bold font-mono text-blue-900 dark:text-blue-100">
              {total_token_count.toLocaleString()}
            </div>
          </div>
        )}
        {prompt_token_count !== undefined && (
          <div className="bg-white dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-600 dark:text-blue-400">Prompt Tokens</div>
            <div className="text-lg font-bold font-mono text-blue-900 dark:text-blue-100">
              {prompt_token_count.toLocaleString()}
            </div>
          </div>
        )}
        {candidates_token_count !== undefined && (
          <div className="bg-white dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-600 dark:text-blue-400">Candidates Tokens</div>
            <div className="text-lg font-bold font-mono text-blue-900 dark:text-blue-100">
              {candidates_token_count.toLocaleString()}
            </div>
          </div>
        )}
        {cached_content_token_count !== undefined && (
          <div className="bg-white dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-600 dark:text-blue-400">Cached Tokens</div>
            <div className="text-lg font-bold font-mono text-blue-900 dark:text-blue-100">
              {cached_content_token_count.toLocaleString()}
            </div>
          </div>
        )}
        {traffic_type && (
          <div className="bg-white dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-600 dark:text-blue-400">Traffic Type</div>
            <div className="text-sm font-mono text-blue-900 dark:text-blue-100">
              {traffic_type}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

