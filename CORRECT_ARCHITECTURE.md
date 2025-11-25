# Correct Architecture: Agent Engine Event Display

## Overview
This document describes the **correct** architecture for displaying Agent Engine events based on the actual event structure from Google Agent Engine.

## Key Insight: Event Structure

Each Agent Engine event has:
```json
{
  "author": "insights_copilot_master",
  "content": {
    "role": "model",
    "parts": [
      // Array of parts - each can contain different types
    ]
  },
  "usage_metadata": {
    "thoughts_token_count": 120,
    "total_token_count": 7993,
    // ... other token info
  },
  "timestamp": 1764081362.637937
}
```

## Part Types

Each part in `content.parts[]` can contain:

### 1. `function_call` (⚡ Thunder Icon)
```json
{
  "function_call": {
    "id": "adk-xyz",
    "name": "external_research_agent",
    "args": { "request": "..." }
  },
  "thought_signature": "base64..."  // Optional
}
```
**Display**: Timeline badge with ⚡ icon, collapsible to show arguments

### 2. `function_response` (✓ Check Icon)
```json
{
  "function_response": {
    "id": "adk-xyz",
    "name": "external_research_agent",
    "response": { "result": "..." }
  }
}
```
**Display**: Timeline badge with ✓ icon, collapsible to show result

### 3. `text` (💬 Chat Bubble)
```json
{
  "text": "While there aren't any brand-new DBS products...",
  "thought_signature": "base64..."  // Optional, indicates reasoning
}
```
**Display**: **Full chat bubble** with author name at header

### 4. `thought_signature` only (🧠 Brain Icon)
```json
{
  "thought_signature": "base64..."
}
```
**Display**: Timeline badge with 🧠 icon (only if there's NO text in same part)

## Architecture Flow

### 1. Agent Engine → API Route (`src/app/api/chat/route.ts`)

For each incoming event:
```typescript
const author = rawEvent.author;
const usageMetadata = rawEvent.usage_metadata;

for (const part of rawEvent.content.parts) {
  // Process each part type
  if (part.function_call) {
    // Send tool_call event
  }
  if (part.function_response) {
    // Send tool_result event
  }
  if (part.text) {
    // Send text_message event (becomes chat bubble)
  }
  if (part.thought_signature && !part.text) {
    // Send thinking event (only if no text)
  }
}
```

### 2. SSE Event Types Sent to Frontend

#### `tool_call`
```json
{
  "type": "tool_call",
  "data": {
    "id": "adk-xyz",
    "name": "external_research_agent",
    "args": { ... },
    "author": "insights_copilot_master",
    "rawEvent": { /* full event */ }
  }
}
```

#### `tool_result`
```json
{
  "type": "tool_result",
  "data": {
    "id": "adk-xyz",
    "name": "external_research_agent",
    "result": { ... },
    "author": "insights_copilot_master",
    "rawEvent": { /* full event */ }
  }
}
```

#### `text_message` ⭐ **Key Change**
```json
{
  "type": "text_message",
  "data": {
    "id": "unique-id",
    "content": "While there aren't any...",
    "author": "insights_copilot_master",
    "hasThinking": true,  // If thought_signature was present
    "thoughtsTokenCount": 120,
    "totalTokenCount": 7993,
    "thoughtSignature": "base64...",
    "timestamp": 1764081362637,
    "rawEvent": { /* full event */ }
  }
}
```

#### `thinking`
```json
{
  "type": "thinking",
  "data": {
    "thoughtsTokenCount": 88,
    "totalTokenCount": 4284,
    "thoughtSignature": "base64...",
    "author": "insights_copilot_master",
    "rawEvent": { /* full event */ }
  }
}
```

### 3. Frontend Processing (`src/hooks/useChat.ts`)

#### Message Types Created

**A. Text Message** (from `text_message` event)
```typescript
{
  id: "unique-id",
  role: "assistant",
  content: "While there aren't any...",
  author: "insights_copilot_master",
  timestamp: Date.now(),
  events: []  // No timeline events
}
```
→ **Displays as**: Chat bubble with author name + text content

**B. Timeline Message** (from `tool_call`, `tool_result`, `thinking` events)
```typescript
{
  id: "unique-id",
  role: "assistant",
  content: "",  // No content!
  author: "insights_copilot_master",
  timestamp: Date.now(),
  events: [
    { type: 'tool_call', data: {...}, rawEvent: {...} },
    { type: 'tool_response', data: {...}, rawEvent: {...} },
    { type: 'thinking', data: {...}, rawEvent: {...} }
  ]
}
```
→ **Displays as**: Timeline with badges (no chat bubble for main content)

### 4. Display (`src/components/chat/MessageBubble.tsx`)

```typescript
export function MessageBubble({ message }) {
  const isTimelineOnly = !message.content && message.events?.length > 0;
  
  return (
    <div>
      {/* Author name */}
      {message.author && <div>{message.author}</div>}
      
      {/* Timeline events */}
      {message.events?.length > 0 && <EventTimeline events={message.events} />}
      
      {/* Text content (chat bubble) */}
      {message.content && (
        <div className="chat-bubble">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      )}
      
      {/* Timestamp (only for non-timeline-only messages) */}
      {!isTimelineOnly && <span>{timestamp}</span>}
    </div>
  );
}
```

## Visual Layout Example

For a typical interaction:

```
┌─────────────────────────────────────────┐
│ User                                    │
│ ┌─────────────────────────────────────┐ │
│ │ recent DBS products for USD SGD     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🤖 Bot                                  │
│ insights_copilot_master                 │ ← Author name
│                                         │
│ ● ⚡ external_research_agent           │ ← Timeline
│ │   (click to expand args)              │
│ │                                       │
│ ● ✓ external_research_agent            │
│     (click to expand result)            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🤖 Bot                                  │
│ insights_copilot_master                 │ ← Author name
│ ┌─────────────────────────────────────┐ │
│ │ While there aren't any brand-new    │ │ ← Chat bubble
│ │ DBS products specifically for       │ │
│ │ USD/SGD highlighted in the recent   │ │
│ │ search results, DBS offers...       │ │
│ └─────────────────────────────────────┘ │
│ 2:36 PM                                 │
└─────────────────────────────────────────┘
```

## Modal Display

When clicking "More" (⋯) button on any event:

```
┌──────────────────────────────────────────┐
│ Event Details                       ✕    │
├──────────────────────────────────────────┤
│                                          │
│ Usage Metadata                           │
│ ┌──────────┬──────────┬──────────────┐  │
│ │ Thoughts │ Total    │ Cached       │  │
│ │ 120      │ 7,993    │ 3,773        │  │
│ └──────────┴──────────┴──────────────┘  │
│                                          │
│ Raw Event Data                           │
│ ┌────────────────────────────────────┐  │
│ │ {                                  │  │ ← Interactive
│ │   ▼ "author": "insights_copilot..."│  │   JSON viewer
│ │   ▼ "content": {...}               │  │   with collapse
│ │   ▼ "usage_metadata": {...}        │  │
│ │ }                                  │  │
│ └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Key Components

### Timeline Components
- `EventTimeline.tsx` - Container with vertical line and dots
- `ThinkingBadge.tsx` - 🧠 Blue badge for thinking
- `ToolCallBadge.tsx` - ⚡ Purple badge for function calls
- `ToolResponseBadge.tsx` - ✓ Green badge for function responses

### Modal Components
- `ThinkingModal.tsx` - Detailed thinking view with tokens
- `EventModal.tsx` - Raw event viewer with usage metadata
- `UsageMetadataDisplay.tsx` - Nice token count display
- `JsonViewer.tsx` - Interactive JSON with collapse

### Core Components
- `MessageBubble.tsx` - Displays both text messages and timeline messages
- `useChat.ts` - Processes SSE events and creates messages

## Critical Design Decisions

### ✅ DO:
1. **Treat each `text` part as a separate chat bubble** with author name
2. **Show author name at the top** of each assistant message
3. **Display usage_metadata nicely** in modals before raw JSON
4. **Use proper icons**: ⚡ for calls, ✓ for responses, 🧠 for thinking
5. **Keep timeline events separate** from text content
6. **Show full raw event in modal** for debugging

### ❌ DON'T:
1. ~~Accumulate all text into one message~~ → Each text is its own bubble
2. ~~Hide tool results in collapsed badges~~ → Show in timeline badges (collapsible)
3. ~~Mix timeline events with text content~~ → Separate message types
4. ~~Show thinking badge if there's text with thought_signature~~ → Text bubble only
5. ~~Display raw JSON without usage metadata first~~ → Show metadata nicely first

## Benefits of This Architecture

1. **Accurate Representation**: Matches actual Agent Engine structure
2. **Clear Attribution**: Author name on every message
3. **Proper Separation**: Timeline events vs. text content
4. **Token Transparency**: Usage metadata displayed nicely
5. **Debugging Support**: Full raw event access in modals
6. **Visual Clarity**: Icons match Google ADK conventions
7. **Extensibility**: Easy to add new part types

## Files Modified/Created

### New Files
- `src/components/ui/JsonViewer.tsx`
- `src/components/chat/UsageMetadataDisplay.tsx`

### Updated Files
- `src/app/api/chat/route.ts` - Parse parts correctly, send `text_message` events
- `src/hooks/useChat.ts` - Handle `text_message`, create separate message types
- `src/components/chat/MessageBubble.tsx` - Display text vs. timeline messages
- `src/components/chat/EventModal.tsx` - Show usage metadata before JSON
- `src/components/chat/ThinkingBadge.tsx` - Updated for correct structure
- `src/components/chat/ToolCallBadge.tsx` - Include raw event for modal
- `src/components/chat/ToolResponseBadge.tsx` - Show result properly

## Summary

The correct architecture treats Agent Engine events as they actually are:
- **author** + **content.parts[]** structure
- Each **part** can be: function_call, function_response, text, or thought_signature
- **Text parts → Chat bubbles** with author name
- **Other parts → Timeline badges** with appropriate icons
- **Usage metadata → Nicely displayed** before raw JSON in modals

This provides an accurate, clear, and debuggable view of all agent activities.

