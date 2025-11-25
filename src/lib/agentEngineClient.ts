/**
 * Agent Engine HTTP SSE Client
 * Connects directly to Google Agent Engine (Vertex AI Reasoning Engine) via HTTP SSE
 * Similar to the Python bridge implementation but in TypeScript
 */

import { AgentEngineEvent } from "@/types/chat";

export interface AgentEngineConfig {
  projectId: string;
  location: string;
  resourceId: string;
}

export class AgentEngineClient {
  private config: AgentEngineConfig;
  private endpointUrl: string;

  constructor(config: AgentEngineConfig) {
    this.config = config;
    
    // Build the endpoint URL
    const agentResourceName = `projects/${config.projectId}/locations/${config.location}/reasoningEngines/${config.resourceId}`;
    this.endpointUrl = `https://${config.location}-aiplatform.googleapis.com/v1/${agentResourceName}:streamQuery?alt=sse`;
    
    console.log(`[AgentEngineClient] Initialized for resource: ${config.resourceId}`);
    console.log(`[AgentEngineClient] Endpoint: ${this.endpointUrl}`);
  }

  /**
   * Get Google Cloud access token using gcloud CLI
   * Note: In production, you should use proper service account credentials
   */
  private async getAuthToken(): Promise<string> {
    try {
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync("gcloud auth print-access-token");
      return stdout.trim();
    } catch (error) {
      console.error("[AgentEngineClient] Failed to get auth token:", error);
      throw new Error("Failed to get auth token. Please run: gcloud auth application-default login");
    }
  }

  /**
   * Stream query to Agent Engine
   * Returns an async iterator of Agent Engine events
   */
  async *streamQuery(message: string, userId: string = "default-user"): AsyncGenerator<AgentEngineEvent> {
    console.log(`[AgentEngineClient] Starting stream query for message: "${message.substring(0, 100)}..."`);
    
    const token = await this.getAuthToken();
    
    const payload = {
      class_method: "async_stream_query",
      input: {
        message,
        user_id: userId,
      },
    };

    console.log(`[AgentEngineClient] Payload:`, JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(this.endpointUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AgentEngineClient] HTTP Error: ${response.status} - ${errorText}`);
        throw new Error(`Agent Engine HTTP ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log("[AgentEngineClient] Stream completed");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          try {
            // Parse JSON response
            const data = JSON.parse(trimmedLine) as AgentEngineEvent;
            
            console.log("[AgentEngineClient] Raw event:", JSON.stringify(data, null, 2));
            
            yield data;
          } catch (parseError) {
            console.warn("[AgentEngineClient] Failed to parse line:", trimmedLine, parseError);
          }
        }
      }
    } catch (error) {
      console.error("[AgentEngineClient] Stream error:", error);
      throw error;
    }
  }

  /**
   * Test connection to Agent Engine
   */
  async testConnection(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      console.log("[AgentEngineClient] Auth token obtained successfully");
      return true;
    } catch (error) {
      console.error("[AgentEngineClient] Connection test failed:", error);
      return false;
    }
  }
}

/**
 * Create a singleton instance of the Agent Engine client
 */
let agentEngineClient: AgentEngineClient | null = null;

/**
 * Load configuration from file or environment
 */
function loadConfig(): AgentEngineConfig {
  // Try to load from config file first
  try {
    if (typeof window === "undefined") {
      // Server-side: try to read config file
      const fs = require("fs");
      const path = require("path");
      const configPath = path.join(process.cwd(), ".agent-config.json");
      
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, "utf-8");
        const fileConfig = JSON.parse(fileContent);
        console.log("[AgentEngineClient] Using configuration from file");
        return {
          projectId: fileConfig.projectId,
          location: fileConfig.location,
          resourceId: fileConfig.agentId,
        };
      }
    }
  } catch (error) {
    console.warn("[AgentEngineClient] Failed to load config file:", error);
  }

  // Fall back to environment variables
  console.log("[AgentEngineClient] Using configuration from environment variables");
  return {
    projectId: process.env.AGENT_ENGINE_PROJECT_ID || "",
    location: process.env.AGENT_ENGINE_LOCATION || "us-central1",
    resourceId: process.env.AGENT_ENGINE_RESOURCE_ID || "",
  };
}

export function getAgentEngineClient(): AgentEngineClient {
  if (!agentEngineClient) {
    const config = loadConfig();

    if (!config.projectId || !config.resourceId) {
      throw new Error(
        "Missing Agent Engine configuration. Please set AGENT_ENGINE_PROJECT_ID and AGENT_ENGINE_RESOURCE_ID environment variables or configure via settings."
      );
    }

    agentEngineClient = new AgentEngineClient(config);
  }

  return agentEngineClient;
}

/**
 * Force refresh the client (used after config changes)
 */
export function refreshAgentEngineClient(): void {
  agentEngineClient = null;
}

