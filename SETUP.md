# ADK Annotation UI - Setup Guide

## Quick Start

Follow these steps to get the ADK Annotation UI up and running.

### 1. Prerequisites

- **Node.js 18+** installed
- **Google Cloud CLI** installed and configured
- **Agent Engine** deployed on Google Cloud (Vertex AI Reasoning Engine)

### 2. Installation

```bash
# Navigate to the project directory
cd adk_annotation

# Install dependencies
npm install
```

### 3. Configuration

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

Add your Agent Engine details:

```env
AGENT_ENGINE_PROJECT_ID=your-gcp-project-id
AGENT_ENGINE_LOCATION=us-central1
AGENT_ENGINE_RESOURCE_ID=your-reasoning-engine-id
```

### 4. Google Cloud Authentication

```bash
# Login to Google Cloud
gcloud auth application-default login

# Verify authentication
gcloud auth list
```

### 5. Run the Application

```bash
# Start development server
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001)

### 6. Verify Setup

1. Open your browser to [http://localhost:3001](http://localhost:3001)
2. Check the health endpoint: [http://localhost:3001/api/health](http://localhost:3001/api/health)
3. Try sending a message in the chat interface

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                          │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │          React Chat Interface                   │    │
│  │  (ChatInterface + useChat hook)                │    │
│  └──────────────────┬─────────────────────────────┘    │
└─────────────────────┼──────────────────────────────────┘
                      │
                      │ HTTP SSE
                      │
┌─────────────────────▼──────────────────────────────────┐
│            Next.js API Routes                           │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │     /api/chat - SSE Endpoint                   │    │
│  │  (Streams events from Agent Engine)            │    │
│  └──────────────────┬─────────────────────────────┘    │
│                     │                                    │
│  ┌─────────────────▼──────────────────────────────┐    │
│  │    Agent Engine Client                          │    │
│  │  (agentEngineClient.ts)                        │    │
│  └──────────────────┬─────────────────────────────┘    │
└─────────────────────┼──────────────────────────────────┘
                      │
                      │ HTTP SSE + Bearer Token
                      │
┌─────────────────────▼──────────────────────────────────┐
│     Google Cloud Agent Engine                           │
│     (Vertex AI Reasoning Engine)                        │
└─────────────────────────────────────────────────────────┘
```

## Communication Flow

1. **User sends message** → Frontend (React)
2. **Frontend makes HTTP POST** → `/api/chat` (Next.js API Route)
3. **API Route streams** → Agent Engine via HTTP SSE
4. **Agent Engine responds** → Stream back to API Route
5. **API Route forwards** → Frontend via SSE
6. **Frontend updates UI** → Display messages, tool calls, etc.

## Key Differences from agent_ui

### What's Different:

- **No CopilotKit**: Direct implementation of chat interface
- **No @ag-ui/client**: Custom Agent Engine client
- **Custom SSE Implementation**: Built from scratch in Next.js
- **Direct HTTP Communication**: No middleware layers

### What's the Same:

- **Theme & Styling**: Identical Tailwind configuration
- **Component Structure**: Similar organization and naming
- **Tool Call Display**: Same visual representation
- **Thinking Indicators**: Same UX patterns

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AGENT_ENGINE_PROJECT_ID` | Your GCP project ID | `my-project-123` |
| `AGENT_ENGINE_LOCATION` | Agent Engine region | `us-central1` |
| `AGENT_ENGINE_RESOURCE_ID` | Reasoning Engine ID | `1234567890` |

## Troubleshooting

### Issue: "Failed to get auth token"

**Solution:**
```bash
gcloud auth application-default login
```

### Issue: "Agent Engine HTTP 403"

**Causes:**
- Incorrect project ID or resource ID
- Missing IAM permissions
- Expired authentication

**Solution:**
```bash
# Check your current project
gcloud config get-value project

# Set the correct project
gcloud config set project YOUR_PROJECT_ID

# Re-authenticate
gcloud auth application-default login
```

### Issue: Port 3001 already in use

**Solution:**
Change the port in `package.json`:
```json
"dev": "next dev -p 3002"
```

### Issue: "Cannot connect to Agent Engine"

**Checks:**
1. Verify Agent Engine is deployed and running
2. Check the resource ID in `.env`
3. Verify network connectivity to GCP
4. Check IAM permissions for your account

### Issue: TypeScript errors

**Solution:**
```bash
# Clean and reinstall dependencies
rm -rf node_modules .next
npm install

# Check for type errors
npm run type-check
```

## Development Tips

### Viewing Logs

The Agent Engine client logs all communication:
- Check browser console for frontend logs
- Check terminal for backend API logs

### Testing the Health Endpoint

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "agentEngine": {
    "connected": true
  }
}
```

### Hot Reload

Next.js automatically reloads when you make changes:
- **Frontend changes**: Instant hot reload
- **API route changes**: Server automatically restarts

## Production Deployment

### Build

```bash
npm run build
```

### Run

```bash
npm start
```

### Environment Setup

For production, ensure:
1. Use service account credentials (not gcloud CLI auth)
2. Set proper CORS policies
3. Use environment variables for all configuration
4. Enable proper logging and monitoring

### Recommended: Use Service Account

Instead of gcloud CLI, use a service account JSON key:

1. Create a service account
2. Download the JSON key
3. Update `agentEngineClient.ts` to use the key file
4. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

## Next Steps

1. **Test the chat interface** with various queries
2. **Customize the UI** to match your branding
3. **Add authentication** if needed
4. **Implement session management** for multi-user scenarios
5. **Add monitoring and logging** for production use

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vertex AI Agent Engine](https://cloud.google.com/vertex-ai/docs)
- [Google Cloud Authentication](https://cloud.google.com/docs/authentication)

