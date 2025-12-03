'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, User, Bot, Download, Wrench } from 'lucide-react';
import { useSavedConversations } from '@/contexts/SavedConversationsContext';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EditableMessage } from './EditableMessage';
import { SavedMessageFeedback } from './SavedMessageFeedback';
import { ToolCallModal } from '../chat/ToolCallModal';
import { EventTimeline } from '../chat/EventTimeline';
import { Invocation, ToolCall } from '@/types/chat';

interface SavedConversationViewProps {
  conversationId: string;
}

export function SavedConversationView({ conversationId }: SavedConversationViewProps) {
  const router = useRouter();
  const { refreshSavedConversations } = useSavedConversations();
  const { showToast } = useToast();
  const [invocations, setInvocations] = useState<Invocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingInvocationId, setEditingInvocationId] = useState<string | null>(null);
  const [selectedToolCall, setSelectedToolCall] = useState<ToolCall | null>(null);

  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/conversations/saved/${conversationId}`);
      const data = await response.json();
      
      if (data.invocations) {
        setInvocations(data.invocations);
      }
    } catch (error) {
      console.error('[SavedConversationView] Error:', error);
      showToast('error', 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [conversationId, showToast]);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId, fetchConversation]);

  const handleSaveEdit = async (invocationId: string, newMessage: string) => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/conversations/saved/${conversationId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invocationId,
          newAgentMessage: newMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setInvocations(prev => 
          prev.map(inv => 
            inv.invocation_id === invocationId 
              ? { ...inv, agent_message: newMessage }
              : inv
          )
        );
        showToast('success', 'Message updated');
      } else {
        showToast('error', `Failed to save: ${data.error}`);
      }
    } catch (error) {
      console.error('[SavedConversationView] Edit error:', error);
      showToast('error', 'Failed to save edit');
    }
  };

  const handleDownload = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/conversations/saved/${conversationId}/raw`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      
      const data = await response.json();
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${conversationId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('success', 'Conversation downloaded');
    } catch (error) {
      console.error('[SavedConversationView] Download error:', error);
      showToast('error', 'Failed to download conversation');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationId) return;

    setShowDeleteConfirm(false);

    try {
      const response = await fetch(`/api/conversations/saved/${conversationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await refreshSavedConversations();
        router.push('/saved');
        showToast('success', 'Conversation deleted');
      } else {
        showToast('error', `Failed to delete: ${data.error}`);
      }
    } catch (error) {
      console.error('[SavedConversationView] Delete error:', error);
      showToast('error', 'Failed to delete conversation');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  if (!conversationId) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 sticky top-0 z-10 bg-white dark:bg-gray-900 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/saved')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Back to list"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Saved Conversation
            </h2>
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {conversationId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            title="Download conversation"
          >
            <Download size={20} className="text-blue-600 dark:text-blue-400" />
          </button>
          
          <button
            onClick={handleDeleteClick}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title="Delete conversation"
          >
            <Trash2 size={20} className="text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading...
          </div>
        ) : invocations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages in this conversation
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {invocations.map((inv) => (
              <div key={inv.invocation_id} className="space-y-4">
                {/* User message */}
                {inv.user_message && (
                  <div className="flex justify-end items-start gap-3">
                    <div className="max-w-[70%] px-4 py-3 rounded-lg bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100">
                      <p className="text-sm whitespace-pre-wrap">{inv.user_message}</p>
                    </div>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center">
                      <User size={18} className="text-blue-600 dark:text-blue-300" />
                    </div>
                  </div>
                )}

                {/* Agent response with tool calls, editing and feedback */}
                {(inv.agent_message || (inv.events && inv.events.length > 0)) && (
                  <div className="flex justify-start items-start gap-3 w-full">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Bot size={18} className="text-gray-600 dark:text-gray-300" />
                    </div>
                    
                    <div className="flex-1 flex flex-col max-w-[80%]">
                      {/* Agent name header - outside the card */}
                      {inv.author && (
                        <div className="text-[10px] font-semibold text-muted-foreground mb-2 px-2">
                          {inv.author}
                        </div>
                      )}

                      {/* Event Timeline - separate card */}
                      {inv.events && inv.events.length > 0 && (
                        <div className="mb-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                          <EventTimeline events={inv.events} />
                        </div>
                      )}

                      {/* Message content card */}
                      {inv.agent_message && (
                        <div className="rounded-2xl px-4 pt-2 pb-3 shadow-sm bg-card border border-border">
                          {/* Tool Call Badges - Above the message (legacy format) */}
                          {inv.tool_calls && inv.tool_calls.length > 0 && !inv.events && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {inv.tool_calls.map((toolCall, idx) => {
                                // Convert saved tool call format to ToolCall format for modal
                                const toolCallForModal: ToolCall = {
                                  id: `${inv.invocation_id}-tool-${idx}`,
                                  name: toolCall.name,
                                  args: toolCall.args,
                                  result: toolCall.result,
                                  status: toolCall.result ? 'success' : 'pending',
                                };

                                return (
                                  <button
                                    key={`${inv.invocation_id}-tool-${idx}`}
                                    onClick={() => setSelectedToolCall(toolCallForModal)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium border border-purple-200 dark:border-purple-800 cursor-pointer"
                                  >
                                    <Wrench size={14} />
                                    <span>{toolCall.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Editable message */}
                          <EditableMessage
                            message={inv.agent_message}
                            originalMessage={inv._custom_original_agent_message}
                            invocationId={inv.invocation_id}
                            isEditing={editingInvocationId === inv.invocation_id}
                            onSave={(newMessage) => handleSaveEdit(inv.invocation_id, newMessage)}
                            onEditingChange={(isEditing) => {
                              setEditingInvocationId(isEditing ? inv.invocation_id : null);
                            }}
                          />
                          
                          {/* Feedback component - always visible when not editing */}
                          {conversationId && editingInvocationId !== inv.invocation_id && (
                            <SavedMessageFeedback
                              conversationId={conversationId}
                              invocationId={inv.invocation_id}
                              existingRating={inv._custom_rating}
                              existingComment={inv._custom_feedback}
                              onUpdate={fetchConversation}
                              hasToolCalls={inv.tool_calls && inv.tool_calls.length > 0}
                              onEditClick={() => setEditingInvocationId(inv.invocation_id)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Tool Call Modal */}
      {selectedToolCall && (
        <ToolCallModal
          isOpen={!!selectedToolCall}
          onClose={() => setSelectedToolCall(null)}
          toolCall={selectedToolCall}
        />
      )}
    </div>
  );
}

