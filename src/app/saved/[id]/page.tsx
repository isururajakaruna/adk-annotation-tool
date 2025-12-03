"use client";

import { useParams } from "next/navigation";
import { ToastProvider } from "@/contexts/ToastContext";
import { SavedConversationsProvider } from "@/contexts/SavedConversationsContext";
import MainLayout from "@/components/layout/MainLayout";
import { SavedConversationView } from "@/components/conversations/SavedConversationView";

export default function ViewSavedConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;

  return (
    <ToastProvider>
      <SavedConversationsProvider>
        <MainLayout 
          sessionId={null}
          adkSessionId={null}
        >
          <SavedConversationView conversationId={conversationId} />
        </MainLayout>
      </SavedConversationsProvider>
    </ToastProvider>
  );
}

