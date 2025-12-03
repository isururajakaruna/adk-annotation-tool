import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/conversations/save
 * Save a conversation from conversations/ to conversations_saved/
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

    const savedDir = path.join(process.cwd(), 'conversations_saved');
    
    // Ensure saved directory exists
    if (!fs.existsSync(savedDir)) {
      fs.mkdirSync(savedDir, { recursive: true });
    }

    // Use conversationId as filename (will overwrite if exists)
    const destFilename = `${conversationId}.json`;
    const destPath = path.join(savedDir, destFilename);
    
    // Check if updating existing conversation
    const isUpdate = fs.existsSync(destPath);

    // Save invocations (overwrite if exists)
    fs.writeFileSync(destPath, JSON.stringify(invocations, null, 2), 'utf-8');

    console.log(`[SaveConversation] ${isUpdate ? 'Updated' : 'Saved'} ${conversationId} as ${destFilename}`);

    return NextResponse.json({
      success: true,
      savedAs: destFilename,
      path: destPath,
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


