/**
 * Local filesystem storage provider
 * Stores conversations as JSON files in conversations_saved/
 */

import fs from 'fs';
import path from 'path';
import { Invocation } from '@/types/chat';
import { StorageProvider, ConversationMetadata } from './types';

export class LocalStorage implements StorageProvider {
  private baseDir: string;

  constructor(baseDir: string = 'conversations_saved') {
    this.baseDir = path.join(process.cwd(), baseDir);
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
      console.log(`[LocalStorage] Created directory: ${this.baseDir}`);
    }
  }

  async save(conversationId: string, invocations: Invocation[]): Promise<void> {
    const filename = `${conversationId}.json`;
    const filepath = path.join(this.baseDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(invocations, null, 2), 'utf-8');
    console.log(`[LocalStorage] Saved conversation: ${filename}`);
  }

  async load(conversationId: string): Promise<Invocation[]> {
    const filename = `${conversationId}.json`;
    const filepath = path.join(this.baseDir, filename);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }
    
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }

  async list(): Promise<ConversationMetadata[]> {
    this.ensureDirectory();
    
    const files = fs.readdirSync(this.baseDir).filter(f => f.endsWith('.json'));
    
    const conversations: ConversationMetadata[] = files.map(filename => {
      const filepath = path.join(this.baseDir, filename);
      const content = fs.readFileSync(filepath, 'utf-8');
      const data: Invocation[] = JSON.parse(content);
      
      const id = filename.replace('.json', '');
      const invocationCount = Array.isArray(data) ? data.length : 0;
      
      let preview = 'No messages';
      if (Array.isArray(data) && data.length > 0 && data[0].user_message) {
        const firstUserMsg = data[0].user_message;
        preview = firstUserMsg.substring(0, 100) + (firstUserMsg.length > 100 ? '...' : '');
      }
      
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
    
    return conversations;
  }

  async delete(conversationId: string): Promise<void> {
    const filename = `${conversationId}.json`;
    const filepath = path.join(this.baseDir, filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`[LocalStorage] Deleted conversation: ${filename}`);
    }
  }

  async exists(conversationId: string): Promise<boolean> {
    const filename = `${conversationId}.json`;
    const filepath = path.join(this.baseDir, filename);
    return fs.existsSync(filepath);
  }

  async getRaw(conversationId: string): Promise<any> {
    return this.load(conversationId);
  }
}

