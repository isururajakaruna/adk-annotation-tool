"use client";

import React from "react";
import Link from "next/link";
import { Eye, Download, Trash2, MessageSquare, Calendar, CheckSquare } from "lucide-react";

interface SavedChatCardProps {
  id: string;
  preview: string;
  timestamp: number;
  messageCount: number;
  isLoading?: boolean;
  isSelected?: boolean;
  onExport: () => void;
  onDelete: () => void;
  onToggleSelect?: () => void;
}

export default function SavedChatCard({
  id,
  preview,
  timestamp,
  messageCount,
  isLoading = false,
  isSelected = false,
  onExport,
  onDelete,
  onToggleSelect,
}: SavedChatCardProps) {
  const date = new Date(timestamp);
  const formattedDate = date.toLocaleString();

  return (
    <div
      className={`
        relative bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-md transition-all
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700'}
        ${isLoading ? 'opacity-50' : ''}
      `}
    >
      {/* Selection checkbox (if in selection mode) */}
      {onToggleSelect && (
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            className={`
              w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
              ${isSelected 
                ? 'bg-blue-500 border-blue-500' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }
            `}
          >
            {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
          </button>
        </div>
      )}

      {/* ID */}
      <div className="mb-2">
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
          {id}
        </span>
      </div>

      {/* Preview */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
        {preview}
      </p>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
        <div className="flex items-center gap-1">
          <MessageSquare size={14} />
          <span>{messageCount} msg{messageCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/saved/${id}`}
          className={`
            flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm
            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <Eye size={16} />
          <span>View</span>
        </Link>
        <button
          onClick={onExport}
          disabled={isLoading}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Export"
        >
          <Download size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={onDelete}
          disabled={isLoading}
          className="px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Delete"
        >
          <Trash2 size={16} className="text-red-600 dark:text-red-400" />
        </button>
      </div>
    </div>
  );
}


