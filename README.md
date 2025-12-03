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

## Deployment Options

### Local Docker

Best for development and testing with persistent storage.

**Prerequisites:**
- Docker installed on your system
- `.env` file configured with your Agent Engine credentials

### Google Cloud Run

For production serverless deployment. **Important:** Cloud Run requires modifications for persistent storage since it has an ephemeral filesystem.

📖 **See [CLOUD_RUN.md](./CLOUD_RUN.md) for complete deployment guide**

**Key considerations:**
- ⚠️ Saved conversations need Cloud Storage integration (local files are lost on restart)
- ✅ Authentication works automatically with service accounts
- ✅ Auto-scales and cost-effective
- ✅ No server management required

## Docker Deployment

### Prerequisites
- Docker installed on your system
- `.env` file configured with your Agent Engine credentials

### Quick Start with Docker

```bash
# 1. Build the Docker image
./docker-build.sh

# 2. Run the container (basic)
./docker-run.sh

# OR with gcloud authentication mounted
./docker-run.sh --mount-gcloud

# OR with additional environment variables
./docker-run.sh --env NODE_ENV=production --env DEBUG=true
```

The application will be available at `http://localhost:3001` (or your configured PORT).

**Options:**
- `--mount-gcloud` - Mount your local gcloud credentials into the container (for local development)
- `--env KEY=VALUE` - Add additional environment variables (can be used multiple times)
- `--tag TAG` - Use a specific image tag (default: latest)

### Manual Docker Commands

**Build the image:**
```bash
docker build -t feedback-workbench:latest .
```

**Run the container:**
```bash
docker run -d \
  --name feedback-workbench-app \
  -p 3001:3001 \
  --env-file .env \
  -v $(pwd)/conversations_saved:/app/conversations_saved \
  feedback-workbench:latest
```

**Useful Docker commands:**
```bash
# View logs
docker logs -f feedback-workbench-app

# Stop container
docker stop feedback-workbench-app

# Restart container
docker restart feedback-workbench-app

# Remove container
docker rm -f feedback-workbench-app
```

### Docker Notes

- **Persistent Data**: The `conversations_saved` directory is mounted as a volume to persist saved conversations
- **Environment Variables**: The container uses the `.env` file for configuration
- **Port Mapping**: Adjust the port mapping (`-p HOST:CONTAINER`) if you change the PORT in `.env`
- **Authentication**: For GCP authentication, ensure your `.env` has the correct credentials or mount your gcloud config

## Scripts Reference

### Setup Script (`./setup.sh`)
Automated setup script that:
- Checks Node.js version (18+ required)
- Installs npm dependencies
- Builds production bundle
- Creates `.env` from template if not exists
- Checks gcloud authentication status

**Usage:**
```bash
./setup.sh
```

### Run Script (`./run.sh`)
Starts the application in production or development mode.

**Usage:**
```bash
# Production mode (default)
./run.sh

# Development mode
./run.sh --dev
# or
./run.sh -d
```

**Features:**
- Automatically detects port from `.env`
- Checks for production build (builds if missing)
- Validates gcloud authentication
- Creates `.env` if missing

### Docker Build Script (`./docker-build.sh`)
Builds a Docker image for the application.

**Usage:**
```bash
# Build with default tag (latest)
./docker-build.sh

# Build with custom tag
./docker-build.sh --tag v1.0.0
# or
./docker-build.sh -t v1.0.0
```

**Output:**
- Image name: `feedback-workbench:latest` (or custom tag)
- Optimized multi-stage build
- Minimal production image (~200MB)

### Docker Run Script (`./docker-run.sh`)
Runs the Docker container with proper configuration.

**Usage:**
```bash
# Basic run
./docker-run.sh

# With gcloud credentials mounted
./docker-run.sh --mount-gcloud

# With additional environment variables
./docker-run.sh --env DEBUG=true --env LOG_LEVEL=verbose

# With custom image tag
./docker-run.sh --tag v1.0.0

# Combined options
./docker-run.sh --mount-gcloud --env NODE_ENV=production --tag latest
```

**Options:**
- `--mount-gcloud` - Mount gcloud credentials from `~/.config/gcloud` (requires gcloud auth)
- `--env KEY=VALUE` - Add environment variable (can be repeated)
- `--tag TAG` - Use specific image tag

**Features:**
- Automatically stops and removes existing container
- Mounts `conversations_saved` directory for persistence
- Reads port from `.env` file
- Creates `.env` from template if missing
- Validates gcloud auth when `--mount-gcloud` is used
- Provides useful management commands

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


