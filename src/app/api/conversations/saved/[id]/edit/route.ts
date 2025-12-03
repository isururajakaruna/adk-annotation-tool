import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Invocation } from '@/types/chat';

/**
 * PUT /api/conversations/saved/[id]/edit
 * Edit an agent message in a saved conversation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { invocationId, newAgentMessage } = body;

    if (!invocationId || !newAgentMessage) {
      return NextResponse.json(
        { success: false, error: 'invocationId and newAgentMessage are required' },
        { status: 400 }
      );
    }

    const savedDir = path.join(process.cwd(), 'conversations_saved');
    const filepath = path.join(savedDir, `${id}.json`);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Read conversation
    const content = fs.readFileSync(filepath, 'utf-8');
    const invocations: Invocation[] = JSON.parse(content);

    // Find and update the invocation
    const invocationIndex = invocations.findIndex(inv => inv.invocation_id === invocationId);
    if (invocationIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Invocation not found' },
        { status: 404 }
      );
    }

    // Save original message if not already saved
    if (!invocations[invocationIndex]._custom_original_agent_message) {
      invocations[invocationIndex]._custom_original_agent_message = invocations[invocationIndex].agent_message;
    }

    // Update the message
    invocations[invocationIndex].agent_message = newAgentMessage;

    // Save updated conversation
    fs.writeFileSync(filepath, JSON.stringify(invocations, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[EditConversation] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

