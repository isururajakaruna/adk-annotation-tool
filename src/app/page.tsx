"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { SavedConversationsProvider, useSavedConversations } from "@/contexts/SavedConversationsContext";
import { ToastProvider } from "@/contexts/ToastContext";
import MainLayout from "@/components/layout/MainLayout";
import SavedChatsList from "@/components/saved/SavedChatsList";
import { SavedConversationView } from "@/components/conversations/SavedConversationView";

function AppContent() {
  const { currentView, viewingConversationId } = useSavedConversations();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [adkSessionId, setAdkSessionId] = useState<string | null>(null);
  const [invocations, setInvocations] = useState<any[]>([]);
  const [newChatHandler, setNewChatHandler] = useState<(() => void) | null>(null);

  const handleSessionUpdate = (newSessionId: string | null, newAdkSessionId: string | null, newInvocations: any[]) => {
    setSessionId(newSessionId);
    setAdkSessionId(newAdkSessionId);
    setInvocations(newInvocations);
  };

  const handleNewChatReady = (handler: () => void) => {
    setNewChatHandler(() => handler);
  };

  // Determine what to render based on view
  const renderContent = () => {
    if (currentView === 'saved') {
      // If viewing a specific conversation, show the viewer
      if (viewingConversationId) {
        return <SavedConversationView />;
      }
      // Otherwise show the list
      return <SavedChatsList />;
    }
    
    // Chat view
    return (
      <ChatInterface 
        onSessionUpdate={handleSessionUpdate} 
        onNewChatReady={handleNewChatReady}
      />
    );
  };

  return (
    <MainLayout 
      sessionId={currentView === 'chat' ? sessionId : null}
      adkSessionId={currentView === 'chat' ? adkSessionId : null}
      invocations={invocations}
      onNewChat={newChatHandler || undefined}
    >
      {renderContent()}
    </MainLayout>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <SavedConversationsProvider>
        <AppContent />
      </SavedConversationsProvider>
    </ToastProvider>
  );
}

