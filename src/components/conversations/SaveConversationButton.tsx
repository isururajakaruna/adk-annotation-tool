'use client';

import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { useSavedConversations } from '@/contexts/SavedConversationsContext';
import { useToast } from '@/contexts/ToastContext';

interface SaveConversationButtonProps {
  conversationId: string | null;
  invocations: any[];
}

export default function SaveConversationButton({ conversationId, invocations }: SaveConversationButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { refreshSavedConversations } = useSavedConversations();
  const { showToast } = useToast();

  const handleSave = async () => {
    if (!conversationId || isSaving || invocations.length === 0) return;

    setIsSaving(true);
    
    try {
      const response = await fetch('/api/conversations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, invocations }),
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccess(true);
        showToast('success', 'Conversation saved successfully');
        await refreshSavedConversations();
        
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);
      } else {
        console.error('[SaveConversationButton] Save failed:', data.error);
        showToast('error', `Failed to save: ${data.error}`);
      }
    } catch (error) {
      console.error('[SaveConversationButton] Error:', error);
      showToast('error', 'Failed to save conversation');
    } finally {
      setIsSaving(false);
    }
  };

  if (!conversationId || invocations.length === 0) {
    return null;
  }

  return (
    <button
      onClick={handleSave}
      disabled={isSaving || showSuccess}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200
        ${showSuccess 
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 cursor-default' 
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 active:scale-95 dark:bg-blue-900/30 dark:text-blue-300'
        }
        ${isSaving ? 'opacity-50 cursor-wait' : ''}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      title="Save conversation"
    >
      {showSuccess ? (
        <>
          <Check size={16} className="animate-pulse" />
          <span>Saved!</span>
        </>
      ) : (
        <>
          <Save size={16} className={isSaving ? 'animate-pulse' : ''} />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </>
      )}
    </button>
  );
}

