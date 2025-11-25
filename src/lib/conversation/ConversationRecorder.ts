/**
 * Conversation Recorder for adk_annotation
 * Records conversations from Agent Engine streams
 */

export interface Invocation {
  invocation_id: string;
  user_message: string;
  agent_message: string;
  timestamp: number;
  user_rating?: number;
  user_feedback?: string;
  tool_calls?: ToolCallRecord[];
}

export interface ToolCallRecord {
  name: string;
  args: any;
  result?: any;
}

class ConversationRecorder {
  private currentSessionId: string | null = null;
  private currentInvocations: Invocation[] = [];

  /**
   * Start a new conversation session
   */
  startSession(sessionId: string) {
    if (this.currentSessionId !== sessionId) {
      console.log(`[ConversationRecorder] Starting new session: ${sessionId}`);
      this.currentSessionId = sessionId;
      this.currentInvocations = [];
    }
  }

  /**
   * Add an invocation to the current session
   */
  recordInvocation(invocation: Invocation) {
    if (!this.currentSessionId) {
      console.warn('[ConversationRecorder] No active session');
      return;
    }
    
    this.currentInvocations.push(invocation);
    console.log(`[ConversationRecorder] Recorded invocation: ${invocation.invocation_id}`);
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Get current invocations
   */
  getInvocations(): Invocation[] {
    return [...this.currentInvocations];
  }

  /**
   * Clear current session
   */
  clearSession() {
    this.currentSessionId = null;
    this.currentInvocations = [];
  }
}

// Singleton instance
let recorder: ConversationRecorder | null = null;

export function getConversationRecorder(): ConversationRecorder {
  if (!recorder) {
    recorder = new ConversationRecorder();
  }
  return recorder;
}

