# Feedback Workbench

A Next.js application for direct communication with Google Agent Engine (Vertex AI Reasoning Engine) for feedback and annotation tasks.

## Features

- **Direct Agent Engine Communication**: Communicates directly with Google Agent Engine via HTTP SSE
- **No External Dependencies**: Does not use CopilotKit or @ag-ui/client
- **Live Chat Interface**: Real-time streaming responses from the agent
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS
- **Tool Call Support**: Displays tool calls and results in an organized manner
- **Thinking Display**: Shows agent reasoning when available
- **Annotation & Feedback**: Inline editing, rating, and commenting on agent responses
- **Session Management**: Persistent ADK sessions with context preservation
- **Export Capabilities**: Export conversations as ADK-compatible evalset files

## Architecture

```
Frontend (React/Next.js)
    ↓ (SSE - Server-Sent Events)
Next.js Backend API Routes
    ↓ (HTTP SSE)
Google Agent Engine (Vertex AI Reasoning Engine)
```

## Prerequisites

1. **Node.js**: Version 18 or higher
2. **Agent Engine Deployment**: A deployed Reasoning Engine on Google Cloud
3. **Google Cloud Authentication**: One of the following:
   - **Local Development**: Google Cloud CLI with `gcloud auth application-default login`
   - **GCP VM/Workbench**: Service account with appropriate permissions (auto-configured)
   - **Production**: Application Default Credentials (ADC) configured

## Quick Start

Use the setup and run scripts for automated setup:

```bash
# Setup: Install dependencies and build production bundle
./setup.sh

# Run in production mode (default)
./run.sh

# Run in development mode
./run.sh --dev
```

## Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Agent Engine configuration:

```env
AGENT_ENGINE_PROJECT_ID=255766800726
AGENT_ENGINE_LOCATION=us-central1
AGENT_ENGINE_RESOURCE_ID=your-reasoning-engine-id
PORT=3001
```

### 3. Authenticate with Google Cloud (if needed)

**For local development:**
```bash
gcloud auth application-default login
```

**For GCP VM or Vertex AI Workbench:**
No authentication needed - service account credentials are automatically available.

### 4. Build and Run

**Production mode:**
```bash
npm run build
npm start
```

**Development mode:**
```bash
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001)

## Project Structure

```
adk_annotation/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── chat/          # Chat endpoint (SSE)
│   │   │   └── health/        # Health check endpoint
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── chat/             # Chat-related components
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ThinkingIndicator.tsx
│   │   │   └── ToolCallCard.tsx
│   │   └── ui/               # Reusable UI components
│   │       ├── Button.tsx
│   │       └── Card.tsx
│   ├── hooks/                # Custom React hooks
│   │   └── useChat.ts        # Chat communication hook
│   ├── lib/                  # Utility libraries
│   │   ├── agentEngineClient.ts  # Agent Engine HTTP SSE client
│   │   └── utils.ts          # Utility functions
│   └── types/                # TypeScript type definitions
│       └── chat.ts
├── public/                   # Static assets
├── .env.example             # Environment variables template
├── next.config.mjs          # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## Key Components

### Agent Engine Client (`lib/agentEngineClient.ts`)

Handles direct HTTP SSE communication with Google Agent Engine:
- Authenticates using gcloud credentials
- Streams responses from Agent Engine
- Parses and yields agent events

### Chat Hook (`hooks/useChat.ts`)

React hook for managing chat state and communication:
- Sends messages to backend API
- Receives and processes SSE events
- Manages message state and loading indicators

### Chat Interface (`components/chat/ChatInterface.tsx`)

Main chat UI component:
- Displays messages in a conversation view
- Shows tool calls and thinking indicators
- Handles user input and submission

## API Endpoints

### POST `/api/chat`

Chat endpoint that streams agent responses via Server-Sent Events (SSE).

**Request Body:**
```json
{
  "message": "Your message here",
  "userId": "user-1"
}
```

**Response:** SSE stream with events:
- `message`: Agent text response
- `tool_call`: Tool invocation
- `tool_result`: Tool execution result
- `thinking`: Agent reasoning
- `done`: Conversation turn completed
- `error`: Error occurred

### GET `/api/health`

Health check endpoint to verify Agent Engine connectivity.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "agentEngine": {
    "connected": true,
    "projectId": "your-project-id",
    "location": "us-central1",
    "resourceId": "your-resource-id"
  }
}
```

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Authentication Issues

**For local development:**
If you get authentication errors, re-authenticate with Google Cloud:

```bash
# Re-authenticate with Google Cloud
gcloud auth application-default login

# Verify your credentials
gcloud auth list
```

**For GCP VM or Vertex AI Workbench:**
Ensure the service account attached to your VM/Workbench has the following permissions:
- `aiplatform.reasoningEngines.query`
- `aiplatform.reasoningEngines.get`

### Connection Issues

Check if Agent Engine is accessible:

```bash
curl http://localhost:3001/api/health
```

### Port Already in Use

If port 3001 is already in use, change the `PORT` in your `.env` file:

```env
PORT=3002
```

## License

Same as the parent ag-ui project.

## Support

For issues and questions, refer to the main ag-ui documentation or create an issue in the repository.

