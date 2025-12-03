import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SavedConversation, Invocation } from '@/types/chat';

// Force dynamic rendering (don't cache this route)
export const dynamic = 'force-dynamic';

/**
 * GET /api/conversations/saved
 * List all saved conversations
 */
export async function GET(request: NextRequest) {
  try {
    const savedDir = path.join(process.cwd(), 'conversations_saved');
    console.log('[ListSavedConversations] Looking in:', savedDir);
    
    // Ensure directory exists
    if (!fs.existsSync(savedDir)) {
      console.log('[ListSavedConversations] Directory does not exist, creating it');
      fs.mkdirSync(savedDir, { recursive: true });
      return NextResponse.json({ conversations: [] });
    }

    const allFiles = fs.readdirSync(savedDir);
    console.log('[ListSavedConversations] All files:', allFiles);
    const files = allFiles.filter(f => f.endsWith('.json'));
    console.log('[ListSavedConversations] JSON files:', files);
    
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


