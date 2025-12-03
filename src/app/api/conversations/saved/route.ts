import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SavedConversation, Invocation } from '@/types/chat';

/**
 * GET /api/conversations/saved
 * List all saved conversations
 */
export async function GET(request: NextRequest) {
  try {
    const savedDir = path.join(process.cwd(), 'conversations_saved');
    
    // Ensure directory exists
    if (!fs.existsSync(savedDir)) {
      fs.mkdirSync(savedDir, { recursive: true });
      return NextResponse.json({ conversations: [] });
    }

    const files = fs.readdirSync(savedDir).filter(f => f.endsWith('.json'));
    
    const conversations: SavedConversation[] = files.map(filename => {
      const filepath = path.join(savedDir, filename);
      const content = fs.readFileSync(filepath, 'utf-8');
      const data: Invocation[] = JSON.parse(content);
      
      // Extract metadata
      const id = filename.replace('.json', '');
      const invocationCount = Array.isArray(data) ? data.length : 0;
      
      // Get first user message as preview
      let preview = 'No messages';
      if (Array.isArray(data) && data.length > 0 && data[0].user_message) {
        const firstUserMsg = data[0].user_message;
        preview = firstUserMsg.substring(0, 100) + (firstUserMsg.length > 100 ? '...' : '');
      }
      
      // Get timestamp
      const timestamp = Array.isArray(data) && data.length > 0 
        ? data[0].timestamp 
        : fs.statSync(filepath).mtime.getTime();
      
      return {
        id,
        filename,
        preview,
        timestamp,
        invocationCount
      };
    });
    
    // Sort by timestamp (newest first)
    conversations.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('[ListSavedConversations] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


