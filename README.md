# Feedback Workbench

A Next.js application for direct communication with Google Agent Engine (Vertex AI Reasoning Engine) for feedback and annotation tasks.

## Features

- **Direct Agent Engine Communication**: Communicates directly with Google Agent Engine via HTTP SSE
- **No External Dependencies**: Does not use CopilotKit or @ag-ui/client
- **Live Chat Interface**: Real-time streaming responses from the agent
- **Modern UI**: Beautiful interface with the same theme as agent_ui
- **Tool Call Support**: Displays tool calls and results in an organized manner
- **Thinking Display**: Shows agent reasoning when available

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
2. **Google Cloud CLI**: Install and authenticate with gcloud
3. **Agent Engine Deployment**: A deployed Reasoning Engine on Google Cloud

## Setup

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
AGENT_ENGINE_PROJECT_ID=your-gcp-project-id
AGENT_ENGINE_LOCATION=us-central1
AGENT_ENGINE_RESOURCE_ID=your-reasoning-engine-id
```

### 3. Authenticate with Google Cloud

```bash
gcloud auth application-default login
```

### 4. Run the Development Server

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

## Comparison with agent_ui

| Feature | agent_ui | adk_annotation |
|---------|----------|----------------|
| CopilotKit | ✅ Yes | ❌ No |
| @ag-ui/client | ✅ Yes | ❌ No |
| Agent Communication | Via CopilotKit | Direct HTTP SSE |
| Frontend-Backend | CopilotKit Runtime | Custom SSE API |
| Theme & Styling | Tailwind + shadcn/ui | Same theme |
| Tool Call Display | ✅ Yes | ✅ Yes |
| Thinking Display | ✅ Yes | ✅ Yes |

## Troubleshooting

### Authentication Issues

If you get authentication errors:

```bash
# Re-authenticate with Google Cloud
gcloud auth application-default login

# Verify your credentials
gcloud auth list
```

### Connection Issues

Check if Agent Engine is accessible:

```bash
curl http://localhost:3001/api/health
```

### Port Already in Use

If port 3001 is already in use, modify the dev script in `package.json`:

```json
"dev": "next dev -p 3002"
```

## License

Same as the parent ag-ui project.

## Support

For issues and questions, refer to the main ag-ui documentation or create an issue in the repository.

