'use client';

import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReactDiffViewer from "react-diff-viewer-continued";
import { cn } from '@/lib/utils';

interface EditableMessageProps {
  message: string;
  originalMessage?: string;
  invocationId: string;
  isEditing?: boolean; // Controlled from parent
  onSave: (newMessage: string) => Promise<void>;
  onEditingChange?: (isEditing: boolean) => void;
}

export function EditableMessage({ 
  message, 
  originalMessage,
  invocationId, 
  isEditing = false,
  onSave,
  onEditingChange 
}: EditableMessageProps) {
  const [editedMessage, setEditedMessage] = useState(message);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  // Update edited message when message prop changes
  useEffect(() => {
    setEditedMessage(message);
  }, [message]);

  const handleCancelEdit = () => {
    setEditedMessage(message);
    if (onEditingChange) onEditingChange(false);
  };

  const handleSaveEdit = async () => {
    if (editedMessage.trim() === message) {
      handleCancelEdit();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editedMessage.trim());
      if (onEditingChange) onEditingChange(false);
    } catch (error) {
      console.error('Failed to save edit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2 w-full min-w-[700px]">
        <textarea
          value={editedMessage}
          onChange={(e) => setEditedMessage(e.target.value)}
          className="w-full min-h-[200px] p-3 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          placeholder="Edit the response..."
          rows={Math.max(8, editedMessage.split('\n').length)}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handleSaveEdit}
            disabled={isSaving || editedMessage.trim() === ''}
            className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={isSaving}
            className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Show diff toggle if content was edited */}
      {originalMessage && message !== originalMessage && (
        <div className="mb-2">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
          >
            {showDiff ? '👁️ Hide Changes' : '🔍 Show Changes'}
          </button>
        </div>
      )}

      {/* Show diff view or normal markdown */}
      {showDiff && originalMessage ? (
        <div className="border rounded-lg overflow-hidden text-xs mb-3">
          <ReactDiffViewer
            oldValue={originalMessage}
            newValue={message}
            splitView={false}
            showDiffOnly={false}
            useDarkTheme={false}
            hideLineNumbers={true}
            styles={{
              variables: {
                light: {
                  diffViewerBackground: '#ffffff',
                  addedBackground: '#e6ffed',
                  addedColor: '#24292e',
                  removedBackground: '#ffeef0',
                  removedColor: '#24292e',
                  wordAddedBackground: '#acf2bd',
                  wordRemovedBackground: '#fdb8c0',
                },
                dark: {
                  diffViewerBackground: '#1f2937',
                  addedBackground: '#064e3b',
                  addedColor: '#d1fae5',
                  removedBackground: '#7f1d1d',
                  removedColor: '#fee2e2',
                  wordAddedBackground: '#065f46',
                  wordRemovedBackground: '#991b1b',
                },
              },
            }}
          />
        </div>
      ) : (
        <div className={cn(
          "prose prose-sm max-w-none dark:prose-invert",
          // Enhanced prose styling
          "prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-p:leading-relaxed prose-p:my-2",
          "prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4",
          "prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4",
          "prose-li:my-1",
          "prose-strong:font-bold prose-strong:text-current",
          "prose-code:bg-gray-100 prose-code:dark:bg-black prose-code:dark:text-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
          "prose-pre:bg-gray-100 prose-pre:dark:bg-black prose-pre:dark:text-gray-100 prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto",
          "prose-a:text-blue-600 prose-a:dark:text-blue-400 prose-a:underline prose-a:hover:text-blue-800",
          "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:dark:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic",
          "prose-table:border-collapse prose-table:w-full",
          "prose-th:border prose-th:border-gray-300 prose-th:dark:border-gray-600 prose-th:px-3 prose-th:py-2 prose-th:bg-gray-100 prose-th:dark:bg-gray-800",
          "prose-td:border prose-td:border-gray-300 prose-td:dark:border-gray-600 prose-td:px-3 prose-td:py-2"
        )}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom renderers for better control
              p: ({node, ...props}) => <p className="my-2" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
              li: ({node, ...props}) => <li className="my-1" {...props} />,
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-2 mb-1" {...props} />,
              pre: ({node, ...props}) => (
                <pre className="bg-gray-100 dark:bg-black dark:text-gray-100 p-3 rounded-lg overflow-x-auto my-2" {...props} />
              ),
              code: ({node, inline, ...props}) => 
                inline ? (
                  <code className="bg-gray-100 dark:bg-black dark:text-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                ) : (
                  <code className="font-mono text-sm" {...props} />
                ),
              strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
              em: ({node, ...props}) => <em className="italic" {...props} />,
            }}
          >
            {message}
          </ReactMarkdown>
        </div>
      )}
      
      {/* Edit indicator if content was modified */}
      {originalMessage && message !== originalMessage && (
        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-2">
          <Edit className="w-3 h-3" />
          <span>Response edited</span>
        </div>
      )}
    </>
  );
}

