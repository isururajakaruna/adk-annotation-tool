import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';

// Force dynamic rendering (don't cache this route)
export const dynamic = 'force-dynamic';

/**
 * GET /api/conversations/saved
 * List all saved conversations using configured storage provider
 */
export async function GET(request: NextRequest) {
  try {
    const storage = getStorageProvider();
    const conversations = await storage.list();

    console.log(`[ListSavedConversations] Found ${conversations.length} conversations`);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('[ListSavedConversations] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


