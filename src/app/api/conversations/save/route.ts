import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';

/**
 * POST /api/conversations/save
 * Save a conversation using configured storage provider (GCS or local)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, invocations } = body;

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Sanitize conversationId
    const sanitizedId = conversationId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitizedId !== conversationId) {
      return NextResponse.json(
        { success: false, error: 'Invalid conversationId format' },
        { status: 400 }
      );
    }

    const storage = getStorageProvider();
    
    // Check if updating existing conversation
    const isUpdate = await storage.exists(conversationId);

    // Save invocations (overwrite if exists)
    await storage.save(conversationId, invocations);

    console.log(`[SaveConversation] ${isUpdate ? 'Updated' : 'Saved'} ${conversationId}`);

    return NextResponse.json({
      success: true,
      savedAs: `${conversationId}.json`,
      isUpdate: isUpdate
    });
  } catch (error) {
    console.error('[SaveConversation] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


