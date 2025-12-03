# Feedback Workbench

A Next.js application for direct communication with Google Agent Engine (Vertex AI Reasoning Engine) for feedback and annotation tasks.

## Features

- **Live Chat Interface**: Real-time streaming responses with Server-Sent Events (SSE)
- **Annotation & Feedback**: Inline editing, 5-star rating, and commenting on agent responses
- **Session Management**: Persistent ADK sessions with automatic context preservation
- **Tool Call Visualization**: Clear display of function calls and results
- **Thinking Display**: View agent reasoning and internal thought processes
- **Conversation Management**: Save, review, and annotate past conversations
- **Evalset Export**: Export annotated conversations as ADK-compatible evalset files for model evaluation
- **Diff Viewer**: Compare original and edited agent responses with syntax highlighting
- **Modern UI**: Responsive interface built with Next.js, React, and Tailwind CSS

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
AGENT_ENGINE_PROJECT_ID=your-gcp-project-number
AGENT_ENGINE_LOCATION=us-central1
AGENT_ENGINE_RESOURCE_ID=your-reasoning-engine-id
PORT=3001
NEXT_PUBLIC_APP_NAME="Feedback Workbench"
```

> **Note:** Use your GCP project **number** (not project ID) for `AGENT_ENGINE_PROJECT_ID`

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

The application will be available at `http://localhost:PORT` (default: 3001)

## How It Works

1. **Frontend** sends user messages to Next.js API routes
2. **Backend** creates/manages ADK sessions and streams responses from Agent Engine
3. **Agent Engine** processes queries and returns streaming events (messages, tool calls, thinking)
4. **Frontend** renders responses in real-time and allows inline annotation
5. **Conversations** can be saved, reviewed, and exported as evalset files for model evaluation

## Usage

### Live Chat
1. Start a new chat session
2. Send messages to your agent
3. View streaming responses with tool calls and thinking steps
4. Rate responses (1-5 stars) and add comments inline
5. Edit agent responses directly and compare with originals using the diff viewer
6. Save annotated conversations

### Saved Conversations
1. View all saved conversations in the sidebar
2. Multi-select conversations for batch export
3. Review annotations (ratings, comments, edits)
4. Export as evalset files for ADK evaluation framework

### Health Check

Visit `http://localhost:PORT/api/health` to verify Agent Engine connectivity (replace `PORT` with your configured port, default: 3001).

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
curl http://localhost:PORT/api/health
```

(Replace `PORT` with your configured port from `.env`, default is 3001)

### Port Configuration

To use a different port, change the `PORT` in your `.env` file:

```env
PORT=3002
```

The application will automatically use the configured port.


