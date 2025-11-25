# Session Logs Directory

This directory contains detailed session logs for debugging SSE events from the Agent Engine.

## Log Files

Each chat session generates two log files:

### 1. Session Log (`session_<sessionId>_<timestamp>.log`)
Human-readable log file with:
- Timestamps
- Log levels (SESSION_START, API_REQUEST, AGENT_ENGINE_RAW, PARSED_EVENT, SSE_SENT, ERROR, SESSION_END)
- Event details and data

### 2. Raw Events JSON (`raw_events_<sessionId>_<timestamp>.json`)
JSON array containing all events in chronological order:
- Raw events from Agent Engine
- Parsed events
- SSE events sent to frontend
- Errors

## Log Levels

- **SESSION_START** - Session initialization
- **API_REQUEST** - Incoming chat request from frontend
- **STREAM_START** - Agent Engine stream begins
- **AGENT_ENGINE_RAW** - Raw event received from Agent Engine
- **PART_ANALYSIS** - Analysis of event parts (text, function_call, thought_signature, etc.)
- **PARSED_EVENT** - Event after parsing/transformation
- **SSE_SENT** - Event sent to frontend via SSE
- **STREAM_COMPLETE** - Agent Engine stream finished
- **SESSION_END** - Session cleanup
- **ERROR** - Any errors encountered

## Debugging Tool Calls and Thinking

If tool calls or thinking events are not appearing in the UI, check:

1. **Raw Events JSON** - Look for events with:
   - `part.function_call` for tool calls
   - `part.function_response` for tool results
   - `part.thought_signature` for thinking events

2. **PART_ANALYSIS** logs - Check if parts are being detected:
   ```
   [PART_ANALYSIS] Analyzing part
   {
     "hasFunctionCall": true,
     "hasThoughtSignature": false,
     ...
   }
   ```

3. **SSE_SENT** logs - Verify events are being sent to frontend:
   ```
   [SSE_SENT] SSE event sent to frontend
   {
     "type": "tool_call",
     "data": { ... }
   }
   ```

## Example Log Analysis

### Missing Tool Calls
```bash
# Check if raw events contain function_call
grep -r "function_call" logs/

# Check if tool_call events were sent
grep -r "tool_call" logs/
```

### Missing Thinking Events
```bash
# Check if raw events contain thought_signature
grep -r "thought_signature" logs/

# Check if thinking events were sent
grep -r '"type":"thinking"' logs/
```

## Log Rotation

Logs are automatically cleaned up:
- Session loggers are deleted 1 hour after session end
- You can manually delete old logs from this directory

## Privacy Note

Log files may contain:
- User messages
- Agent responses
- Tool call arguments and results
- Thinking/reasoning text

**Do not commit logs to version control or share them publicly if they contain sensitive data.**

## Analyzing Logs

Use the provided script:
```bash
# From project root
node scripts/analyze-logs.js <sessionId>
```

Or manually:
```bash
# View latest session log
ls -t logs/session_*.log | head -1 | xargs cat

# View latest raw events
ls -t logs/raw_events_*.json | head -1 | xargs cat | jq .

# Count events by type
cat logs/raw_events_*.json | jq '.[].type' | sort | uniq -c
```

