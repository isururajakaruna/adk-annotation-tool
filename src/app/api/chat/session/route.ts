/**
 * Session Management API
 * Creates and manages chat sessions with the Agent Engine
 */

import { NextRequest, NextResponse } from "next/server";
import { getAgentEngineClient } from "@/lib/agentEngineClient";
import { generateId } from "@/lib/utils";

/**
 * POST /api/chat/session
 * Creates a new chat session
 */
export async function POST(req: NextRequest) {
  console.log("[Session API] Creating new session");
  
  try {
    const agentClient = getAgentEngineClient();
    
    // Generate a unique frontend session ID
    const frontendSessionId = generateId();
    
    // Create ADK session
    console.log(`[Session API] Creating ADK session for frontend ID: ${frontendSessionId}`);
    const adkSessionId = await agentClient.createSession(frontendSessionId);
    
    console.log(`[Session API] ✅ Session created:`);
    console.log(`  Frontend ID: ${frontendSessionId}`);
    console.log(`  ADK Session ID: ${adkSessionId}`);
    
    return NextResponse.json({
      sessionId: frontendSessionId,
      adkSessionId: adkSessionId,
      created: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Session API] Error creating session:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create session",
      },
      { status: 500 }
    );
  }
}


