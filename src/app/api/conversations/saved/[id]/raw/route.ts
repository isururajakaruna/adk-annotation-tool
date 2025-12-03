import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';

/**
 * GET /api/conversations/saved/[id]/raw
 * Get raw conversation data for download/export
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const storage = getStorageProvider();

    const data = await storage.getRaw(id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GetRawConversation] Error:', error);
    
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


