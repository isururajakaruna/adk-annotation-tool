import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const CONVERSATIONS_DIR = path.join(process.cwd(), "conversations_saved");

/**
 * Export conversations in evalset format (ADK evaluation format)
 * POST /api/conversations/export
 * Body: { conversationIds: string[] } - IDs to export, or empty array for all
 */
export async function POST(req: NextRequest) {
  try {
    const { conversationIds } = await req.json();

    // Ensure conversations directory exists
    try {
      await fs.access(CONVERSATIONS_DIR);
    } catch {
      return NextResponse.json(
        { success: false, error: "No saved conversations found" },
        { status: 404 }
      );
    }

    // Get all conversation files
    const files = await fs.readdir(CONVERSATIONS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    if (jsonFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "No conversations to export" },
        { status: 404 }
      );
    }

    // Filter files if specific IDs provided
    let filesToExport = jsonFiles;
    if (conversationIds && conversationIds.length > 0) {
      filesToExport = jsonFiles.filter((file) => {
        const fileId = file.replace("conversation_", "").replace(".json", "");
        return conversationIds.includes(fileId);
      });
    }

    if (filesToExport.length === 0) {
      return NextResponse.json(
        { success: false, error: "No matching conversations found" },
        { status: 404 }
      );
    }

    // Build evalset structure
    const evalCases = [];

    for (const file of filesToExport) {
      const filePath = path.join(CONVERSATIONS_DIR, file);
      const content = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(content);

      // Data is an array of invocations
      const invocations = Array.isArray(data) ? data : (data.invocations || []);

      // Convert each invocation to an eval case
      for (const invocation of invocations) {
        const conversationEntry: any = {
          invocation_id: invocation.invocation_id,
          user_content: {
            parts: [
              {
                text: invocation.user_message,
              },
            ],
            role: "user",
          },
          final_response: {
            parts: [
              {
                text: invocation.agent_message,
              },
            ],
            role: "model",
          },
        };

        // Add custom fields for annotations (at conversation entry level)
        if (invocation._custom_rating !== undefined) {
          conversationEntry._custom_rating = invocation._custom_rating;
        }
        if (invocation._custom_feedback) {
          conversationEntry._custom_feedback = invocation._custom_feedback;
        }
        if (invocation._custom_original_agent_message) {
          conversationEntry._custom_original_agent_message =
            invocation._custom_original_agent_message;
        }

        // Add tool calls as intermediate_data if present
        if (invocation.tool_calls && invocation.tool_calls.length > 0) {
          conversationEntry.intermediate_data = {
            invocation_events: invocation.tool_calls.map((tc: any, idx: number) => ({
              author: "agent",
              content: {
                parts: [
                  {
                    function_call: {
                      id: `tool-${idx}`,
                      name: tc.name,
                      args: tc.args,
                    },
                  },
                ],
                role: "model",
              },
            })),
          };
        }

        const evalCase = {
          eval_id: `case${generateShortId()}`,
          conversation: [conversationEntry],
        };

        evalCases.push(evalCase);
      }
    }

    // Create evalset object
    const evalset = {
      eval_set_id: `evalset_${generateShortId()}`,
      name: `export_${new Date().toISOString().split("T")[0]}`,
      eval_cases: evalCases,
    };

    return NextResponse.json({
      success: true,
      evalset,
      count: evalCases.length,
    });
  } catch (error) {
    console.error("[API/conversations/export] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to generate short IDs
function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

