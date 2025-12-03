import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';

/**
 * GET /api/conversations/saved/[id]
 * Get a specific saved conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const storage = getStorageProvider();

    const invocations = await storage.load(id);
    return NextResponse.json({ invocations });
  } catch (error: any) {
    console.error('[GetSavedConversation] Error:', error);
    
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

/**
 * DELETE /api/conversations/saved/[id]
 * Delete a saved conversation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const storage = getStorageProvider();

    await storage.delete(id);
    console.log(`[DeleteSavedConversation] Deleted: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DeleteSavedConversation] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


