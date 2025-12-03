"use client";

import { ToastProvider } from "@/contexts/ToastContext";
import { SavedConversationsProvider } from "@/contexts/SavedConversationsContext";
import MainLayout from "@/components/layout/MainLayout";
import SavedChatsList from "@/components/saved/SavedChatsList";

export default function SavedConversationsPage() {
  return (
    <ToastProvider>
      <SavedConversationsProvider>
        <MainLayout 
          sessionId={null}
          adkSessionId={null}
        >
          <SavedChatsList />
        </MainLayout>
      </SavedConversationsProvider>
    </ToastProvider>
  );
}

