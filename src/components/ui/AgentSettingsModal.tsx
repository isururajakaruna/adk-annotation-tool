"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface AgentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function AgentSettingsModal({ isOpen, onClose, onSaved }: AgentSettingsModalProps) {
  const [agentId, setAgentId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [location, setLocation] = useState("us-central1");
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [source, setSource] = useState<"env" | "file">("env");

  // Load current configuration
  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/agent-config");
      if (response.ok) {
        const data = await response.json();
        setAgentId(data.agentId || "");
        setProjectId(data.projectId || "");
        setLocation(data.location || "us-central1");
        setSource(data.source || "env");
      }
    } catch (error) {
      console.error("Failed to load agent config:", error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!agentId || !projectId || !location) {
      setTestResult({ success: false, message: "Please fill in all fields" });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/agent-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, projectId, location }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({ success: true, message: "Successfully connected to agent!" });
      } else {
        setTestResult({ 
          success: false, 
          message: data.details || data.error || "Connection test failed" 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : "Connection test failed" 
      });
    } finally {
      setTesting(false);
    }
  };

  const saveConfig = async () => {
    // Must test successfully first
    if (!testResult?.success) {
      setTestResult({ success: false, message: "Please test the connection first" });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/agent-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, projectId, location }),
      });

      if (response.ok) {
        onSaved?.();
        onClose();
        // Reload page to apply new configuration
        window.location.reload();
      } else {
        const data = await response.json();
        setTestResult({ success: false, message: data.error || "Failed to save configuration" });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to save configuration" 
      });
    } finally {
      setSaving(false);
    }
  };

  const revertToEnv = async () => {
    if (!confirm("Are you sure you want to revert to environment variables?")) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/agent-config", {
        method: "DELETE",
      });

      if (response.ok) {
        onSaved?.();
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to revert config:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agent Engine Configuration">
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Source indicator */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Current source:</span>
              <span className={`font-semibold ${source === "file" ? "text-green-600" : "text-blue-600"}`}>
                {source === "file" ? "📄 Config File" : "🔧 Environment Variables"}
              </span>
            </div>

            {/* Agent ID */}
            <div>
              <label className="block text-sm font-medium mb-2">Agent ID</label>
              <input
                type="text"
                value={agentId}
                onChange={(e) => {
                  setAgentId(e.target.value);
                  setTestResult(null);
                }}
                placeholder="Enter Agent ID (Resource ID)"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Project ID */}
            <div>
              <label className="block text-sm font-medium mb-2">Project ID</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setTestResult(null);
                }}
                placeholder="Enter GCP Project ID"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <select
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setTestResult(null);
                }}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="us-central1">us-central1</option>
                <option value="us-east1">us-east1</option>
                <option value="us-west1">us-west1</option>
                <option value="europe-west1">europe-west1</option>
                <option value="asia-southeast1">asia-southeast1</option>
              </select>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`flex items-start gap-2 p-3 rounded-lg border ${
                testResult.success 
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
              }`}>
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}

            {/* Info box */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs space-y-1">
                <p>Configuration saved to <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.agent-config.json</code></p>
                <p>This overrides environment variables until deleted.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={testConnection}
                disabled={testing || !agentId || !projectId}
                variant="secondary"
                className="flex-1"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>

              <Button
                onClick={saveConfig}
                disabled={saving || !testResult?.success}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save & Apply"
                )}
              </Button>
            </div>

            {/* Revert option */}
            {source === "file" && (
              <button
                onClick={revertToEnv}
                disabled={saving}
                className="w-full text-sm text-muted-foreground hover:text-foreground underline"
              >
                Revert to environment variables
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

