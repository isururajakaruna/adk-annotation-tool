"use client";

import React from "react";
import PermanentSidebar from "../navigation/PermanentSidebar";
import Header from "../ui/Header";
import { useSavedConversations } from "@/contexts/SavedConversationsContext";

interface MainLayoutProps {
  children: React.ReactNode;
  sessionId?: string | null;
  adkSessionId?: string | null;
  invocations?: any[];
  onNewChat?: () => void;
}

export default function MainLayout({ children, sessionId, adkSessionId, invocations, onNewChat }: MainLayoutProps) {
  const { currentView, setCurrentView } = useSavedConversations();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Permanent Left Sidebar */}
      <PermanentSidebar 
        activeView={currentView} 
        onNavigate={setCurrentView} 
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header sessionId={sessionId} adkSessionId={adkSessionId} invocations={invocations} onNewChat={onNewChat} />
        
        {/* Dynamic Content (Chat or Saved Chats List) */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

