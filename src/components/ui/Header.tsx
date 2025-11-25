"use client";

import React, { useState, useEffect } from "react";
import { Bot, RefreshCw, Settings, Download } from "lucide-react";
import { useSavedConversations } from "@/contexts/SavedConversationsContext";
import SaveConversationButton from "@/components/conversations/SaveConversationButton";
import { AgentSettingsModal } from "./AgentSettingsModal";
import { useToast } from "@/contexts/ToastContext";

interface HeaderProps {
  sessionId?: string | null;
  adkSessionId?: string | null;
  getInvocationsForSave?: () => any[];
  onNewChat?: () => void;
}

export default function Header({ sessionId, adkSessionId, getInvocationsForSave, onNewChat }: HeaderProps) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [agentConfig, setAgentConfig] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { currentView } = useSavedConversations();
  const { showToast } = useToast();
  
  // Load agent configuration
  useEffect(() => {
    loadAgentConfig();
  }, []);

  const loadAgentConfig = async () => {
    try {
      const response = await fetch("/api/agent-config");
      if (response.ok) {
        const data = await response.json();
        setAgentConfig(data);
      }
    } catch (error) {
      console.error("Failed to load agent config:", error);
    }
  };

  const handleExportCurrentChat = async () => {
    if (!getInvocationsForSave || !sessionId) {
      showToast("error", "No active conversation to export");
      return;
    }

    const invocations = getInvocationsForSave();
    if (invocations.length === 0) {
      showToast("error", "No messages to export");
      return;
    }

    setIsExporting(true);
    try {
      // Save to temporary location
      const saveResponse = await fetch("/api/conversations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: sessionId, invocations }),
      });

      if (!saveResponse.ok) throw new Error("Failed to save conversation");

      // Export as evalset
      const exportResponse = await fetch("/api/conversations/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationIds: [sessionId] }),
      });

      if (!exportResponse.ok) throw new Error("Failed to export conversation");

      const result = await exportResponse.json();

      if (result.success) {
        // Download as JSON
        const blob = new Blob([JSON.stringify(result.evalset, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${result.evalset.name}.evalset.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast("success", `Exported ${result.count} invocation(s) as evalset`);
      } else {
        throw new Error(result.error || "Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      showToast("error", "Failed to export conversation");
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <header className="border-b bg-white dark:bg-gray-900 shadow-sm">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Bot className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ADK Annotation UI
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* New Chat button (only show in chat view) */}
          {currentView === 'chat' && onNewChat && (
            <button
              onClick={onNewChat}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
              title="Start new conversation"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}
          
          {/* ADK Session ID (only show in chat view with active session) */}
          {currentView === 'chat' && adkSessionId && (
            <div className="flex items-center gap-2 text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
              <span className="text-gray-500 dark:text-gray-500 font-medium">Session ID:</span>
              <span className="font-mono text-gray-600 dark:text-gray-400 hidden sm:inline">{adkSessionId}</span>
              <span className="font-mono text-gray-600 dark:text-gray-400 inline sm:hidden">{adkSessionId.slice(0, 12)}...</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(adkSessionId);
                  console.log('ADK Session ID copied:', adkSessionId);
                }}
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="Copy session ID"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}

          {/* Agent ID (only show in chat view) */}
          {currentView === 'chat' && agentConfig && (
            <div className="flex items-center gap-2 text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
              <span className="text-gray-500 dark:text-gray-500 font-medium">Agent:</span>
              <span className="font-mono text-gray-600 dark:text-gray-400 hidden sm:inline">
                {agentConfig.agentId || "not-set"}
              </span>
              <span className="font-mono text-gray-600 dark:text-gray-400 inline sm:hidden">
                {agentConfig.agentId ? `${agentConfig.agentId.slice(0, 12)}...` : "not-set"}
              </span>
              {agentConfig.source === "file" && (
                <span className="text-green-600 dark:text-green-400" title="Using config file">📄</span>
              )}
            </div>
          )}
          
          {/* Save button (only show in chat view with active session) */}
          {currentView === 'chat' && sessionId && getInvocationsForSave && (
            <SaveConversationButton conversationId={sessionId} getInvocationsForSave={getInvocationsForSave} />
          )}

          {/* Export as Evalset button (only show in chat view with active session) */}
          {currentView === 'chat' && sessionId && getInvocationsForSave && (
            <button
              onClick={handleExportCurrentChat}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
              title="Export current conversation as ADK evalset"
            >
              {isExporting ? (
                <>
                  <Download className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </>
              )}
            </button>
          )}
          
          {/* Settings button (only show in chat view) */}
          {currentView === 'chat' && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Agent settings"
            >
              <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100" />
            </button>
          )}
        </div>
      </div>

      {/* Agent Settings Modal */}
      <AgentSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSaved={loadAgentConfig}
      />
    </header>
  );
}

