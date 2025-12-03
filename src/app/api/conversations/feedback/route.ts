import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
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

    const storage = getStorageProvider();

    // Read conversation
    const invocations: Invocation[] = await storage.load(conversationId);

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
    await storage.save(conversationId, invocations);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[AddFeedback] Error:', error);
    
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

