import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
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

    const storage = getStorageProvider();

    // Read conversation
    const invocations: Invocation[] = await storage.load(id);

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
    await storage.save(id, invocations);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[EditConversation] Error:', error);
    
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

