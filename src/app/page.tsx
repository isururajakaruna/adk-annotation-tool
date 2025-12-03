"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { SavedConversationsProvider } from "@/contexts/SavedConversationsContext";
import { ToastProvider } from "@/contexts/ToastContext";
import MainLayout from "@/components/layout/MainLayout";

function AppContent() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [adkSessionId, setAdkSessionId] = useState<string | null>(null);
  const [getInvocationsForSave, setGetInvocationsForSave] = useState<(() => any[]) | null>(null);
  const [newChatHandler, setNewChatHandler] = useState<(() => void) | null>(null);

  const handleSessionUpdate = (
    newSessionId: string | null, 
    newAdkSessionId: string | null, 
    getInvocationsFunc: () => any[]
  ) => {
    setSessionId(newSessionId);
    setAdkSessionId(newAdkSessionId);
    setGetInvocationsForSave(() => getInvocationsFunc);
  };

  const handleNewChatReady = (handler: () => void) => {
    setNewChatHandler(() => handler);
  };

  return (
    <MainLayout 
      sessionId={sessionId}
      adkSessionId={adkSessionId}
      getInvocationsForSave={getInvocationsForSave || undefined}
      onNewChat={newChatHandler || undefined}
    >
      <ChatInterface 
        onSessionUpdate={handleSessionUpdate} 
        onNewChatReady={handleNewChatReady}
      />
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

