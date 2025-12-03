# Docker Setup Guide

## Quick Start Examples

### Example 1: Local Development with gcloud
```bash
# Authenticate with gcloud
gcloud auth application-default login

# Build image
./docker-build.sh

# Run with gcloud credentials mounted
./docker-run.sh --mount-gcloud

# Check logs
docker logs -f feedback-workbench-app
```

### Example 2: GCP VM/Workbench (No gcloud needed)
```bash
# Build image
./docker-build.sh

# Run (service account credentials are auto-available)
./docker-run.sh

# Verify
curl http://localhost:3001/api/health
```

### Example 3: Custom Configuration
```bash
# Run with custom settings
./docker-run.sh \
  --mount-gcloud \
  --env NODE_ENV=production \
  --env DEBUG=true \
  --tag v1.0.0
```

## How Environment Variables Work

### Build Time vs Runtime

**Build Time (during `docker build`):**
- `.env` is **NOT** copied into the image (listed in `.dockerignore`)
- `.env.example` IS copied as a template for reference
- This is a security best practice - secrets should not be baked into images

**Runtime (during `docker run`):**
- Environment variables are injected via `--env-file .env` flag
- Docker reads your `.env` file and sets them as environment variables in the container
- The Next.js standalone server reads from `process.env`

### What Gets Copied

#### ✅ Copied into Image:
- Application source code (`src/`)
- Built Next.js application (`.next/standalone/`)
- Static assets (`.next/static/`, `public/`)
- Configuration files (`next.config.mjs`, `tsconfig.json`, etc.)
- `.env.example` (as a template)
- Package dependencies (node_modules bundled in standalone)

#### ❌ NOT Copied (in `.dockerignore`):
- `.env` (secrets - provided at runtime)
- `node_modules/` (rebuilt during build)
- `.next/` build artifacts (recreated during build)
- `conversations_saved/` (mounted as volume)
- `logs/` (created at runtime)
- Development scripts (`setup.sh`, `run.sh`, etc.)
- Git files
- Documentation files

### Directory Structure in Container

```
/app/
├── server.js                    # Standalone Next.js server (entry point)
├── .next/
│   └── static/                  # Static assets
├── public/                      # Public files
├── .env.example                 # Template (NOT used at runtime)
├── conversations_saved/         # Volume mount (persists on host)
└── logs/                        # Created at runtime
```

## Configuration Flow

### 1. Build Phase
```bash
./docker-build.sh
```
- Copies all source code except `.env`
- Runs `npm run build` with `output: 'standalone'`
- Creates optimized production image
- Final image size: ~200MB

### 2. Run Phase

**Basic run:**
```bash
./docker-run.sh
```

**With gcloud authentication:**
```bash
./docker-run.sh --mount-gcloud
```

**With additional environment variables:**
```bash
./docker-run.sh --env DEBUG=true --env LOG_LEVEL=info
```

**What it does:**
- Checks for `.env` on host (creates from template if missing)
- Passes environment variables via `--env-file .env`
- Optionally mounts gcloud credentials (with `--mount-gcloud`)
- Validates gcloud authentication if mounting credentials
- Mounts `conversations_saved/` directory
- Starts container with `node server.js`

### 3. Runtime
- Container starts with environment variables from `.env`
- Next.js reads config from `process.env.AGENT_ENGINE_*`
- Application connects to Agent Engine using provided credentials
- Saved conversations persist in mounted volume

## Required Environment Variables

Your `.env` file on the **host machine** must contain:

```env
AGENT_ENGINE_PROJECT_ID=your-gcp-project-number
AGENT_ENGINE_LOCATION=us-central1
AGENT_ENGINE_RESOURCE_ID=your-reasoning-engine-id
PORT=3001
NEXT_PUBLIC_APP_NAME="Feedback Workbench"
```

## Volume Mounts

### conversations_saved/
```bash
-v $(pwd)/conversations_saved:/app/conversations_saved
```
- **Purpose**: Persist saved conversations
- **Host path**: `./conversations_saved/` (same directory as docker-run.sh)
- **Container path**: `/app/conversations_saved/`
- **Why**: Without this mount, saved conversations would be lost when container stops

### Optional: logs/
To persist logs, add:
```bash
-v $(pwd)/logs:/app/logs
```

## Authentication in Docker

### Local Development (Recommended Method)

**Using the docker-run.sh script:**
```bash
# 1. Authenticate with gcloud
gcloud auth application-default login

# 2. Run container with credentials mounted
./docker-run.sh --mount-gcloud
```

This automatically:
- Validates your gcloud authentication
- Mounts your credentials read-only into the container
- Sets `GOOGLE_APPLICATION_CREDENTIALS` environment variable

**Manual method:**
```bash
# 1. Authenticate
gcloud auth application-default login

# 2. Run with manual mount
docker run -d \
  --name feedback-workbench-app \
  -p 3001:3001 \
  --env-file .env \
  -v ~/.config/gcloud:/home/nextjs/.config/gcloud:ro \
  -e GOOGLE_APPLICATION_CREDENTIALS=/home/nextjs/.config/gcloud/application_default_credentials.json \
  -v $(pwd)/conversations_saved:/app/conversations_saved \
  feedback-workbench:latest
```

### GCP VM/Workbench
If running on GCP compute:
- Service account credentials are automatically available
- No additional mounting needed
- Just ensure the service account has proper permissions

### Using Service Account Key File
If using a service account key file:
1. Set `GOOGLE_APPLICATION_CREDENTIALS` in `.env`:
```env
GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json
```
2. Mount the key file:
```bash
-v /path/to/key.json:/app/service-account-key.json:ro
```

## Troubleshooting

### Environment variables not working
- Ensure `.env` exists on the host machine
- Check `docker logs feedback-workbench-app` for startup errors
- Verify variables with: `docker exec feedback-workbench-app env | grep AGENT_ENGINE`
- Add additional variables with: `./docker-run.sh --env YOUR_VAR=value`

### Saved conversations not persisting
- Check volume mount is correct: `docker inspect feedback-workbench-app | grep Mounts -A 20`
- Ensure `conversations_saved/` directory exists on host
- Check permissions: `ls -la conversations_saved/`

### Port conflicts
- Change PORT in `.env`
- Update port mapping in `docker-run.sh`: `-p NEW_PORT:NEW_PORT`
- Ensure container PORT env matches exposed port

### Authentication failures
- Verify credentials in `.env`
- **For local dev**: Use `./docker-run.sh --mount-gcloud` to mount gcloud credentials
- Check gcloud auth status: `gcloud auth list`
- Verify gcloud application-default credentials: `gcloud auth application-default print-access-token`
- Check if credentials are mounted: `docker exec feedback-workbench-app ls -la /home/nextjs/.config/gcloud`
- For service account: verify key file is mounted correctly
- Check container logs: `docker logs feedback-workbench-app`

## Advanced Usage

### Custom Network
```bash
docker network create feedback-network
docker run -d \
  --name feedback-workbench-app \
  --network feedback-network \
  -p 3001:3001 \
  --env-file .env \
  -v $(pwd)/conversations_saved:/app/conversations_saved \
  feedback-workbench:latest
```

### Health Checks
Add health check to `docker run`:
```bash
--health-cmd='curl -f http://localhost:3001/api/health || exit 1' \
--health-interval=30s \
--health-timeout=10s \
--health-retries=3
```

### Resource Limits
```bash
--memory="512m" \
--cpus="1.0"
```

## Security Notes

1. **Never commit `.env` to Git** - it contains secrets
2. **Never bake `.env` into Docker images** - images can be inspected
3. **Use `.dockerignore`** - prevents accidental secret inclusion
4. **Run as non-root user** - container uses `nextjs` user (UID 1001)
5. **Read-only mounts** - use `:ro` flag for sensitive files
6. **Minimal base image** - uses `node:18-alpine` (smaller attack surface)

## Production Deployment

For production environments:
1. Use secrets management (AWS Secrets Manager, GCP Secret Manager, etc.)
2. Use orchestration (Kubernetes, Cloud Run, etc.)
3. Enable health checks and monitoring
4. Use proper logging (stdout/stderr to centralized logging)
5. Implement backup strategy for `conversations_saved/`
6. Use HTTPS/TLS termination via reverse proxy or load balancer

