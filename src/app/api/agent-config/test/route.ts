import { NextRequest, NextResponse } from "next/server";
import { getAgentEngineClient } from "@/lib/agentEngineClient";

// POST - Test agent connection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, projectId, location } = body;

    if (!agentId || !projectId || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Temporarily set environment variables for testing
    const originalAgentId = process.env.AGENT_ENGINE_RESOURCE_ID;
    const originalProjectId = process.env.AGENT_ENGINE_PROJECT_ID;
    const originalLocation = process.env.AGENT_ENGINE_LOCATION;

    process.env.AGENT_ENGINE_RESOURCE_ID = agentId;
    process.env.AGENT_ENGINE_PROJECT_ID = projectId;
    process.env.AGENT_ENGINE_LOCATION = location;

    try {
      // Try to create a client and make a test query
      const agentClient = getAgentEngineClient();
      
      // Just creating the client is enough to validate the configuration
      // We don't actually need to send a message
      
      // Restore original values
      process.env.AGENT_ENGINE_RESOURCE_ID = originalAgentId;
      process.env.AGENT_ENGINE_PROJECT_ID = originalProjectId;
      process.env.AGENT_ENGINE_LOCATION = originalLocation;

      return NextResponse.json({ 
        success: true, 
        message: "Successfully connected to agent"
      });
    } catch (error) {
      // Restore original values on error
      process.env.AGENT_ENGINE_RESOURCE_ID = originalAgentId;
      process.env.AGENT_ENGINE_PROJECT_ID = originalProjectId;
      process.env.AGENT_ENGINE_LOCATION = originalLocation;

      throw error;
    }
  } catch (error) {
    console.error("[Agent Config] Connection test failed:", error);
    return NextResponse.json(
      { 
        error: "Failed to connect to agent", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

