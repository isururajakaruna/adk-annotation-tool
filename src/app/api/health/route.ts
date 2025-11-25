/**
 * Health check endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { getAgentEngineClient } from "@/lib/agentEngineClient";

export async function GET(req: NextRequest) {
  try {
    // Test Agent Engine connection
    const agentClient = getAgentEngineClient();
    const isConnected = await agentClient.testConnection();

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      agentEngine: {
        connected: isConnected,
        projectId: process.env.AGENT_ENGINE_PROJECT_ID || "not-set",
        location: process.env.AGENT_ENGINE_LOCATION || "us-central1",
        resourceId: process.env.AGENT_ENGINE_RESOURCE_ID || "not-set",
      },
    });
  } catch (error) {
    console.error("[Health] Error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

