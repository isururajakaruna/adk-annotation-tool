# Agent Configuration System

## Overview
Dynamic agent configuration system that allows users to change Agent Engine settings without modifying environment variables or restarting the application.

## Features

### 1. **Header Display**
- **Session ID**: Clearly labeled with "Session ID:" prefix
- **Agent ID**: Shows current agent with "Agent:" prefix
- **Settings Icon**: Gear icon (⚙️) replaces "Connected" status

### 2. **Configuration Sources**
The system supports two configuration sources (in priority order):

1. **Config File** (`.agent-config.json`) - Higher priority
   - Stored in project root
   - Overrides environment variables
   - Indicated by 📄 icon in header
   
2. **Environment Variables** - Fallback
   - `AGENT_ENGINE_PROJECT_ID`
   - `AGENT_ENGINE_LOCATION`
   - `AGENT_ENGINE_RESOURCE_ID`

### 3. **Settings Modal**
Accessible via gear icon (⚙️) in header:

#### Fields:
- **Agent ID** - The reasoning engine resource ID
- **Project ID** - GCP project ID
- **Location** - GCP region (dropdown)

#### Actions:
- **Test Connection** - Validates configuration before saving
- **Save & Apply** - Saves config and reloads page
- **Revert to Environment Variables** - Deletes config file

#### Workflow:
1. Click gear icon to open settings
2. Enter agent configuration
3. Click "Test Connection" (required)
4. If test succeeds, "Save & Apply" becomes enabled
5. Click "Save & Apply" to persist and reload

### 4. **Configuration Storage**

#### File Location:
```
project-root/.agent-config.json
```

#### File Format:
```json
{
  "agentId": "your-resource-id",
  "projectId": "your-gcp-project",
  "location": "us-central1"
}
```

#### .gitignore:
The config file is automatically ignored in git:
```
.agent-config.json
```

## API Endpoints

### GET `/api/agent-config`
Returns current configuration and source

**Response:**
```json
{
  "agentId": "resource-id",
  "projectId": "project-id",
  "location": "us-central1",
  "source": "file" | "env"
}
```

### POST `/api/agent-config`
Saves configuration to file

**Request:**
```json
{
  "agentId": "resource-id",
  "projectId": "project-id",
  "location": "us-central1"
}
```

### DELETE `/api/agent-config`
Removes config file (reverts to env vars)

### POST `/api/agent-config/test`
Tests agent connection with provided config

**Request:**
```json
{
  "agentId": "resource-id",
  "projectId": "project-id",
  "location": "us-central1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected to agent"
}
```

## Implementation Details

### Client Initialization
`src/lib/agentEngineClient.ts`:
```typescript
function loadConfig(): AgentEngineConfig {
  // 1. Try to read .agent-config.json
  // 2. Fall back to environment variables
  // 3. Return configuration
}
```

### Configuration Priority:
1. **Config file exists?** → Use it
2. **No config file?** → Use environment variables
3. **Missing required fields?** → Show error

### Refresh Mechanism:
After saving configuration:
1. Config file is written
2. Page reloads automatically
3. New client instance created with updated config

## User Experience

### First Time Use:
1. Application starts with env var configuration
2. Header shows: `Agent: [env-var-value]`
3. No 📄 icon (using environment)

### After Configuration:
1. User clicks ⚙️ settings icon
2. Fills in agent details
3. Tests connection (✅ or ❌)
4. Saves configuration
5. Page reloads
6. Header shows: `Agent: [new-value] 📄`

### Reverting:
1. User clicks ⚙️ settings icon
2. Clicks "Revert to environment variables"
3. Config file deleted
4. Page reloads
5. Back to env var configuration

## Benefits

1. **No Restart Required**: Change agents on the fly
2. **Multi-Environment**: Different agents for dev/staging/prod
3. **User-Specific**: Each developer can use their own agent
4. **Safe Testing**: Test connection before applying
5. **Easy Revert**: One click to go back to env vars
6. **Git-Friendly**: Config file ignored, no accidental commits
7. **Clear Visibility**: Always know which config source is active

## Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| `Agent: abc-123` | Using agent ID "abc-123" |
| `📄` icon | Configuration from file |
| No icon | Configuration from environment |
| `Session ID: xyz` | Current session identifier |
| `⚙️` gear icon | Click to configure |

## Security Notes

1. **Config file is local only** - Never committed to git
2. **Uses gcloud auth** - Requires authenticated gcloud CLI
3. **Test before save** - Validates connection before persisting
4. **Server-side only** - Config reading happens server-side
5. **No sensitive data** - File contains IDs, not credentials

## Troubleshooting

### "Connection test failed"
- Check gcloud authentication: `gcloud auth application-default login`
- Verify agent ID exists in GCP
- Confirm project ID is correct
- Check region/location matches agent location

### Config not loading
- Ensure `.agent-config.json` is in project root
- Check file is valid JSON
- Verify file permissions
- Check server logs for errors

### Still using env vars
- Look for 📄 icon in header
- No icon = using environment variables
- Check if config file exists: `ls -la .agent-config.json`
- Verify file wasn't gitignored by mistake

## Future Enhancements

- [ ] Multiple agent profiles
- [ ] Auto-refresh without page reload
- [ ] Connection status indicator (live)
- [ ] Agent health monitoring
- [ ] Configuration history
- [ ] Import/export config
- [ ] Team sharing (encrypted)

