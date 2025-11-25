import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// POST - Test agent connection by creating a real session
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

    // First, get gcloud access token
    let token: string;
    try {
      const { stdout } = await execAsync("gcloud auth print-access-token");
      token = stdout.trim();
      
      if (!token) {
        throw new Error("No access token returned");
      }
    } catch (error) {
      console.error("[Agent Config] Auth test failed:", error);
      return NextResponse.json(
        { 
          error: "Authentication failed", 
          details: "Unable to get gcloud access token. Please run 'gcloud auth login'" 
        },
        { status: 401 }
      );
    }

    // Create a test session with the agent
    try {
      const agentResourceName = `projects/${projectId}/locations/${location}/reasoningEngines/${agentId}`;
      const endpointUrl = `https://${location}-aiplatform.googleapis.com/v1/${agentResourceName}:streamQuery?alt=sse`;

      console.log("[Agent Config] Creating test session with:", agentResourceName);

      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          class_method: "async_stream_query",
          input: {
            message: "test",
            user_id: "config-test-user",
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Agent Config] Agent Engine error:", response.status, errorText);
        
        // Parse error message
        let errorMessage = "Invalid agent configuration";
        if (errorText.includes("NOT_FOUND") || response.status === 404) {
          errorMessage = `Agent ID '${agentId}' not found in project '${projectId}' at location '${location}'`;
        } else if (errorText.includes("PERMISSION_DENIED") || response.status === 403) {
          errorMessage = "Permission denied. Check your GCP project access and ensure the agent exists.";
        } else if (errorText.includes("INVALID_ARGUMENT") || response.status === 400) {
          errorMessage = "Invalid agent configuration. Check Agent ID, Project ID, and Location.";
        } else {
          // Try to parse JSON error
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error?.message || errorMessage;
          } catch {
            // If not JSON, keep the generic message
          }
        }
        
        return NextResponse.json(
          { 
            error: "Configuration validation failed", 
            details: errorMessage
          },
          { status: 400 }
        );
      }

      // If we get a 200 response, the agent exists and we can connect to it
      // We don't need to wait for the actual response, just verify the connection works
      console.log("[Agent Config] Successfully connected to agent");
      
      // Close the connection immediately - we just needed to verify it works
      try {
        const reader = response.body?.getReader();
        if (reader) {
          await reader.cancel();
        }
      } catch (e) {
        // Ignore errors when canceling
      }

      return NextResponse.json({ 
        success: true, 
        message: "Successfully connected and validated agent"
      });
    } catch (error) {
      console.error("[Agent Config] Connection test failed:", error);
      return NextResponse.json(
        { 
          error: "Connection test failed", 
          details: error instanceof Error ? error.message : "Unable to connect to Agent Engine" 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Agent Config] Test failed:", error);
    return NextResponse.json(
      { 
        error: "Failed to test connection", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

