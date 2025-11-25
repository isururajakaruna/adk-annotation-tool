'use client';

import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface EditableMessageProps {
  message: string;
  invocationId: string;
  onSave: (newMessage: string) => Promise<void>;
  onEditingChange?: (isEditing: boolean) => void;
}

export function EditableMessage({ 
  message, 
  invocationId, 
  onSave,
  onEditingChange 
}: EditableMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedMessage(message);
    if (onEditingChange) onEditingChange(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
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
      setIsEditing(false);
      if (onEditingChange) onEditingChange(false);
    } catch (error) {
      console.error('Failed to save edit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-[70%]">
        <textarea
          value={editedMessage}
          onChange={(e) => setEditedMessage(e.target.value)}
          className="w-full min-h-[100px] px-4 py-3 rounded-lg border-2 border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          autoFocus
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSaveEdit}
            disabled={isSaving || editedMessage.trim() === ''}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Check size={16} />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative max-w-[70%]">
      <div className="px-4 py-3 rounded-lg bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
        <p className="text-sm whitespace-pre-wrap">{message}</p>
      </div>
      <button
        onClick={handleStartEdit}
        className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
        title="Edit message"
      >
        <Edit2 size={14} className="text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
}

