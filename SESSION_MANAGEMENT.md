# Session Management Implementation

## Overview
The application now properly manages ADK sessions for maintaining conversation context across multiple messages.

## How It Works

### 1. **Session Initialization** (on app load)
```
Frontend → GET /api/chat/session → Backend creates ADK session → Returns session ID → Saved to localStorage
```

### 2. **Session Persistence** (on page refresh)
- Session ID is stored in `localStorage`
- On refresh, the same session is restored
- Context is maintained across page reloads

### 3. **Message Flow** (during chat)
```
User message → Frontend sends with session ID → Backend looks up ADK session → Passes to Agent Engine
```

### 4. **New Chat** (explicit action)
- User clicks "New Chat" button in header
- Backend creates new ADK session
- Old session ID is replaced in localStorage
- Fresh conversation starts

## Key Components

### Backend
- **`/api/chat/session/route.ts`**: Creates new ADK sessions
- **`/api/chat/route.ts`**: Maps frontend sessions to ADK sessions
- **`agentEngineClient.ts`**: Manages ADK session lifecycle

### Frontend
- **`useChat.ts`**: Initializes and manages session state
- **`Header.tsx`**: "New Chat" button
- **`page.tsx`**: Connects chat to layout

## Testing

### Via Web UI:
1. Start the dev server: `npm run dev`
2. Open http://localhost:3000
3. Send a message: "My name is Alice"
4. Send another: "What's my name?"
5. Agent should remember! ✅
6. Refresh the page and continue chatting (same session)
7. Click "New Chat" to start fresh

### Via Test Script:
```bash
./test-sessions.sh test
```

## Session Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Browser)                                         │
├─────────────────────────────────────────────────────────────┤
│  1. App loads                                               │
│  2. Check localStorage for existing session                 │
│  3. If none, POST /api/chat/session                        │
│  4. Store session ID in localStorage                        │
│  5. Use session ID for all messages                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend (Next.js API)                                      │
├─────────────────────────────────────────────────────────────┤
│  1. Receive frontend session ID                             │
│  2. Check session map for existing ADK session              │
│  3. If none, create ADK session via async_create_session    │
│  4. Store mapping: frontend ID → ADK session ID             │
│  5. Use ADK session ID for Agent Engine queries             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Agent Engine (Google Vertex AI)                            │
├─────────────────────────────────────────────────────────────┤
│  1. Receive query with session_id                           │
│  2. Load session state and history                          │
│  3. Process message with full context                       │
│  4. Update session state                                    │
│  5. Stream response back                                    │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

Session management uses the same agent configuration:
- **Project ID**: From `.agent-config.json` or `.env`
- **Location**: us-central1 (or configured)
- **Agent ID**: Your Reasoning Engine ID

## localStorage Keys
- `chatSessionId`: Current frontend session ID

## Important Notes

1. **Context is maintained** only within the same session
2. **Page refresh** keeps the same session (via localStorage)
3. **New Chat button** is the only way to start fresh
4. **Backend session map** is in-memory (resets on server restart)
5. For production, consider persisting session map to Redis/database

