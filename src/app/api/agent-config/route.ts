import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), ".agent-config.json");

interface AgentConfig {
  agentId: string;
  projectId: string;
  location: string;
}

// GET - Read agent configuration
export async function GET() {
  try {
    // Try to read from config file first
    try {
      const fileContent = await fs.readFile(CONFIG_FILE, "utf-8");
      const config = JSON.parse(fileContent);
      return NextResponse.json({ ...config, source: "file" });
    } catch (fileError) {
      // File doesn't exist, use environment variables
      const config: AgentConfig = {
        agentId: process.env.AGENT_ENGINE_RESOURCE_ID || "",
        projectId: process.env.AGENT_ENGINE_PROJECT_ID || "",
        location: process.env.AGENT_ENGINE_LOCATION || "us-central1",
      };
      return NextResponse.json({ ...config, source: "env" });
    }
  } catch (error) {
    console.error("[Agent Config] Error reading config:", error);
    return NextResponse.json(
      { error: "Failed to read agent configuration" },
      { status: 500 }
    );
  }
}

// POST - Save agent configuration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, projectId, location } = body;

    if (!agentId || !projectId || !location) {
      return NextResponse.json(
        { error: "Missing required fields: agentId, projectId, location" },
        { status: 400 }
      );
    }

    const config: AgentConfig = { agentId, projectId, location };

    // Write to file
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("[Agent Config] Error saving config:", error);
    return NextResponse.json(
      { error: "Failed to save agent configuration" },
      { status: 500 }
    );
  }
}

// DELETE - Remove config file (revert to env)
export async function DELETE() {
  try {
    try {
      await fs.unlink(CONFIG_FILE);
      return NextResponse.json({ success: true, message: "Config file deleted, using environment variables" });
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return NextResponse.json({ success: true, message: "Config file already doesn't exist" });
      }
      throw error;
    }
  } catch (error) {
    console.error("[Agent Config] Error deleting config:", error);
    return NextResponse.json(
      { error: "Failed to delete agent configuration" },
      { status: 500 }
    );
  }
}


