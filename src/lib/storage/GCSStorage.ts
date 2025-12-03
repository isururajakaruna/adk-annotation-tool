/**
 * Google Cloud Storage provider
 * Stores conversations as JSON files in a GCS bucket
 */

import { Storage } from '@google-cloud/storage';
import { Invocation } from '@/types/chat';
import { StorageProvider, ConversationMetadata } from './types';

export class GCSStorage implements StorageProvider {
  private storage: Storage;
  private bucketName: string;
  private prefix: string;

  constructor(bucketName?: string, prefix: string = 'conversations') {
    this.storage = new Storage();
    this.bucketName = bucketName || process.env.GCS_BUCKET_NAME || 'feedback-workbench-conversations';
    this.prefix = prefix;
    
    console.log(`[GCSStorage] Initialized with bucket: ${this.bucketName}, prefix: ${this.prefix}`);
  }

  private getFilePath(conversationId: string): string {
    return `${this.prefix}/${conversationId}.json`;
  }

  async save(conversationId: string, invocations: Invocation[]): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(this.getFilePath(conversationId));
    
    await file.save(JSON.stringify(invocations, null, 2), {
      contentType: 'application/json',
      metadata: {
        conversationId,
        timestamp: Date.now().toString(),
        invocationCount: invocations.length.toString(),
      },
    });
    
    console.log(`[GCSStorage] Saved conversation: ${conversationId} to gs://${this.bucketName}/${this.getFilePath(conversationId)}`);
  }

  async load(conversationId: string): Promise<Invocation[]> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(this.getFilePath(conversationId));
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }
    
    const [contents] = await file.download();
    return JSON.parse(contents.toString());
  }

  async list(): Promise<ConversationMetadata[]> {
    const bucket = this.storage.bucket(this.bucketName);
    const [files] = await bucket.getFiles({ prefix: `${this.prefix}/` });
    
    const conversations: ConversationMetadata[] = await Promise.all(
      files
        .filter(file => file.name.endsWith('.json'))
        .map(async (file) => {
          try {
            const [contents] = await file.download();
            const data: Invocation[] = JSON.parse(contents.toString());
            
            const filename = file.name.split('/').pop() || '';
            const id = filename.replace('.json', '');
            const invocationCount = Array.isArray(data) ? data.length : 0;
            
            let preview = 'No messages';
            if (Array.isArray(data) && data.length > 0 && data[0].user_message) {
              const firstUserMsg = data[0].user_message;
              preview = firstUserMsg.substring(0, 100) + (firstUserMsg.length > 100 ? '...' : '');
            }
            
            // Get timestamp from data or file metadata
            let timestamp = Date.now();
            if (Array.isArray(data) && data.length > 0 && data[0].timestamp) {
              timestamp = data[0].timestamp;
            } else if (file.metadata.timeCreated) {
              timestamp = new Date(file.metadata.timeCreated).getTime();
            }
            
            return {
              id,
              filename,
              preview,
              timestamp,
              invocationCount
            };
          } catch (error) {
            console.error(`[GCSStorage] Error processing file ${file.name}:`, error);
            // Return minimal metadata for corrupted files
            const filename = file.name.split('/').pop() || '';
            const id = filename.replace('.json', '');
            return {
              id,
              filename,
              preview: 'Error loading conversation',
              timestamp: file.metadata.timeCreated ? new Date(file.metadata.timeCreated).getTime() : Date.now(),
              invocationCount: 0
            };
          }
        })
    );
    
    // Sort by timestamp (newest first)
    conversations.sort((a, b) => b.timestamp - a.timestamp);
    
    return conversations;
  }

  async delete(conversationId: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(this.getFilePath(conversationId));
    
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log(`[GCSStorage] Deleted conversation: ${conversationId}`);
    }
  }

  async exists(conversationId: string): Promise<boolean> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(this.getFilePath(conversationId));
    const [exists] = await file.exists();
    return exists;
  }

  async getRaw(conversationId: string): Promise<any> {
    return this.load(conversationId);
  }
}

