"use client";

import React, { useEffect, useState } from "react";
import { useSavedConversations } from "@/contexts/SavedConversationsContext";
import { useToast } from "@/contexts/ToastContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import SavedChatCard from "./SavedChatCard";
import { Search, Loader2 } from "lucide-react";

export default function SavedChatsList() {
  const { savedConversations, fetchSavedConversations, setViewingConversation } = useSavedConversations();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc'>('date-desc');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true);
      await fetchSavedConversations();
      setIsLoading(false);
    };
    loadConversations();
  }, [fetchSavedConversations]);

  // Filter conversations
  const filteredConversations = savedConversations.filter(conv => 
    conv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort conversations
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    return sortBy === 'date-desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
  });

  const handleView = (id: string) => {
    setViewingConversation(id);
  };

  const handleExport = async (id: string) => {
    setLoadingId(id);
    try {
      const response = await fetch(`/api/conversations/saved/${id}/raw`);
      if (!response.ok) throw new Error('Failed to fetch conversation');
      
      const conversation = await response.json();
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(conversation, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('success', 'Conversation exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      showToast('error', 'Failed to export conversation');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;

    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    setLoadingId(id);
    
    try {
      const response = await fetch(`/api/conversations/saved/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete conversation');
      
      await fetchSavedConversations();
      showToast('success', 'Conversation deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      showToast('error', 'Failed to delete conversation');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading saved conversations...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Saved Conversations
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {savedConversations.length} {savedConversations.length === 1 ? 'conversation' : 'conversations'} saved
            </p>
          </div>

          {/* Search and Sort */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by ID or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date-desc' | 'date-asc')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
            </select>
          </div>

          {/* Empty State */}
          {savedConversations.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No saved conversations yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start a chat and click the save button to preserve your conversations
              </p>
            </div>
          )}

          {/* Conversations Grid */}
          {sortedConversations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedConversations.map((conversation) => (
                <SavedChatCard
                  key={conversation.id}
                  id={conversation.id}
                  preview={conversation.preview}
                  timestamp={conversation.timestamp}
                  messageCount={conversation.invocationCount}
                  isLoading={loadingId === conversation.id}
                  onView={() => handleView(conversation.id)}
                  onExport={() => handleExport(conversation.id)}
                  onDelete={() => handleDeleteClick(conversation.id)}
                />
              ))}
            </div>
          )}

          {/* No Results */}
          {savedConversations.length > 0 && sortedConversations.length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No conversations found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search query
              </p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}

