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

    // Find next available filename (handle duplicates)
    let destFilename = `${conversationId}.json`;
    let destPath = path.join(savedDir, destFilename);
    let copyNumber = 1;

    while (fs.existsSync(destPath)) {
      destFilename = `${conversationId}_copy${copyNumber}.json`;
      destPath = path.join(savedDir, destFilename);
      copyNumber++;
    }

    // Save invocations
    fs.writeFileSync(destPath, JSON.stringify(invocations, null, 2), 'utf-8');

    console.log(`[SaveConversation] Saved ${conversationId} as ${destFilename}`);

    return NextResponse.json({
      success: true,
      savedAs: destFilename,
      path: destPath
    });
  } catch (error) {
    console.error('[SaveConversation] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

