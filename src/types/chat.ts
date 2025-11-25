export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  author?: string; // Agent/author name
  toolCalls?: ToolCall[];
  thinking?: string;
  thinkingTokens?: {
    thoughtsTokenCount?: number;
    totalTokenCount?: number;
  };
  thinkingStartTime?: number;
  thinkingEndTime?: number;
  thoughtSignature?: any;
  events?: AgentEvent[]; // NEW: Track all events in order
  rawEvent?: any; // Store raw event for modal display
  // Inline annotations (always set for assistant messages)
  _custom_rating?: number; // 1-5 stars rating
  _custom_feedback?: string; // User comment/feedback
  _custom_original_agent_message?: string; // ALWAYS store original agent response (populated for ALL assistant messages)
  isEditing?: boolean; // UI state for inline editing
}

export interface AgentEvent {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_response';
  timestamp: number;
  data: ThinkingEventData | ToolCallEventData | ToolResponseEventData;
  rawEvent?: any; // For "More" modal
}

export interface ThinkingEventData {
  thoughtsTokenCount?: number;
  totalTokenCount?: number;
  thoughtSignature?: string;
}

export interface ToolCallEventData {
  id: string;
  name: string;
  args: any;
}

export interface ToolResponseEventData {
  id: string;
  name: string;
  result: any;
}

export interface ToolCall {
  id: string;
  name: string;
  args: any;
  result?: any;
  status?: "pending" | "success" | "error";
}

export interface SavedConversation {
  id: string;
  filename: string;
  preview: string;
  timestamp: number;
  invocationCount: number;
}

export interface Invocation {
  invocation_id: string;
  user_message: string;
  agent_message: string;
  timestamp: number;
  _custom_rating?: number;
  _custom_feedback?: string;
  _custom_original_agent_message: string; // ALWAYS populated with original agent response
  tool_calls?: ToolCallRecord[];
}

export interface ToolCallRecord {
  name: string;
  args: any;
  result?: any;
}

export interface ChatEvent {
  type: "message" | "tool_call" | "tool_result" | "thinking" | "error" | "done";
  data: any;
  timestamp: number;
}

export interface AgentEngineEvent {
  author?: string;
  content?: {
    role: string;
    parts: Array<{
      text?: string;
      function_call?: {
        id: string;
        name: string;
        args: any;
      };
      function_response?: {
        id: string;
        name: string;
        response: any;
      };
      thought_signature?: string; // Base64-encoded string
    }>;
  };
  usage_metadata?: {
    thoughts_token_count?: number;
    total_token_count?: number;
    candidates_token_count?: number;
    prompt_token_count?: number;
  };
  model_version?: string;
  finish_reason?: string;
}

export interface WebSocketMessage {
  type: "user_message" | "system" | "ping";
  payload?: any;
}

export interface WebSocketResponse {
  type: "chat_event" | "error" | "pong" | "connected";
  event?: ChatEvent;
  error?: string;
}

