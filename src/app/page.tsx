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
  const [invocations, setInvocations] = useState<any[]>([]);

  const handleSessionUpdate = (newSessionId: string | null, newInvocations: any[]) => {
    setSessionId(newSessionId);
    setInvocations(newInvocations);
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
    return <ChatInterface onSessionUpdate={handleSessionUpdate} />;
  };

  return (
    <MainLayout sessionId={currentView === 'chat' ? sessionId : null} invocations={invocations}>
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

