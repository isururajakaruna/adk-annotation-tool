import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Invocation } from '@/types/chat';

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
    const savedDir = path.join(process.cwd(), 'conversations_saved');
    const filepath = path.join(savedDir, `${id}.json`);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const invocations: Invocation[] = JSON.parse(content);

    return NextResponse.json({ invocations });
  } catch (error) {
    console.error('[GetSavedConversation] Error:', error);
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
    const savedDir = path.join(process.cwd(), 'conversations_saved');
    const filepath = path.join(savedDir, `${id}.json`);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    fs.unlinkSync(filepath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DeleteSavedConversation] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


