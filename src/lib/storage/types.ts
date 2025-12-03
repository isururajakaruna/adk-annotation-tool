/**
 * Storage abstraction layer for conversations
 * Supports both local filesystem and Google Cloud Storage
 */

import { Invocation } from '@/types/chat';

export interface ConversationMetadata {
  id: string;
  filename: string;
  preview: string;
  timestamp: number;
  invocationCount: number;
}

export interface StorageProvider {
  /**
   * Save a conversation
   */
  save(conversationId: string, invocations: Invocation[]): Promise<void>;

  /**
   * Load a conversation by ID
   */
  load(conversationId: string): Promise<Invocation[]>;

  /**
   * List all saved conversations with metadata
   */
  list(): Promise<ConversationMetadata[]>;

  /**
   * Delete a conversation by ID
   */
  delete(conversationId: string): Promise<void>;

  /**
   * Check if a conversation exists
   */
  exists(conversationId: string): Promise<boolean>;

  /**
   * Get raw JSON for a conversation
   */
  getRaw(conversationId: string): Promise<any>;
}

