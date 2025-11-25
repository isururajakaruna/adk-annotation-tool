import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Invocation } from '@/types/chat';

/**
 * POST /api/conversations/feedback
 * Add or update feedback for an invocation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, invocationId, rating, feedback } = body;

    if (!conversationId || !invocationId) {
      return NextResponse.json(
        { success: false, error: 'conversationId and invocationId are required' },
        { status: 400 }
      );
    }

    const savedDir = path.join(process.cwd(), 'conversations_saved');
    const filepath = path.join(savedDir, `${conversationId}.json`);

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
    const invocation = invocations.find(inv => inv.invocation_id === invocationId);
    if (!invocation) {
      return NextResponse.json(
        { success: false, error: 'Invocation not found' },
        { status: 404 }
      );
    }

    // Update feedback with _custom_ prefix
    if (rating !== undefined) invocation._custom_rating = rating;
    if (feedback !== undefined) invocation._custom_feedback = feedback;

    // Save updated conversation
    fs.writeFileSync(filepath, JSON.stringify(invocations, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AddFeedback] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

