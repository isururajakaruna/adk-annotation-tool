# Environment Variables Template

Create a `.env` file in the project root with the following variables:

```env
# Google Cloud Agent Engine Configuration
# Get these values from your Google Cloud Console

# Project Number (NOT Project ID) - Find at: https://console.cloud.google.com/home/dashboard
AGENT_ENGINE_PROJECT_ID=your-gcp-project-number

# Region where your Agent Engine is deployed
AGENT_ENGINE_LOCATION=us-central1

# Reasoning Engine Resource ID - Find in Vertex AI > Reasoning Engines
AGENT_ENGINE_RESOURCE_ID=your-reasoning-engine-id

# Application Configuration
PORT=3001
NEXT_PUBLIC_APP_NAME="Feedback Workbench"

# Storage Configuration
# ==================================================================================
# USE_CLOUD_STORAGE: Set to "true" to use Google Cloud Storage (default: true)
#                    Set to "false" to use local filesystem
# 
# Google Cloud Storage is required for:
# - Cloud Run deployment
# - Multi-instance deployments
# - Production environments with high availability
#
# Local filesystem is suitable for:
# - Development
# - Single-instance Docker deployments
# - VMs with persistent disks
# ==================================================================================

USE_CLOUD_STORAGE=true

# Google Cloud Storage Bucket Name (required if USE_CLOUD_STORAGE=true)
# Create bucket: gsutil mb -l us-central1 gs://your-bucket-name
GCS_BUCKET_NAME=feedback-workbench-conversations

# Optional: Custom prefix for conversation files in GCS bucket
# GCS_PREFIX=conversations
```

## Quick Setup

```bash
# Copy this template
cp ENV_TEMPLATE.md .env

# Edit .env and replace the placeholder values
nano .env
```

## Storage Options

### Option 1: Google Cloud Storage (Default - Recommended for Production)

```env
USE_CLOUD_STORAGE=true
GCS_BUCKET_NAME=your-bucket-name
```

**Create the bucket:**
```bash
gsutil mb -l us-central1 gs://your-bucket-name
```

**Pros:**
- ✅ Works on Cloud Run
- ✅ Persistent across container restarts
- ✅ Multi-instance support
- ✅ Built-in redundancy

**Cons:**
- Small cost (~$0.02/GB/month)
- Requires bucket creation
- Network latency (minimal)

### Option 2: Local Filesystem

```env
USE_CLOUD_STORAGE=false
```

**Pros:**
- ✅ Free
- ✅ Faster (no network calls)
- ✅ Simple setup

**Cons:**
- ❌ Doesn't work on Cloud Run
- ❌ Data lost on container restart (Cloud Run)
- ❌ Single-instance only

## Command Line Override

You can override the storage setting when running Docker:

```bash
# Force local storage (even if .env says USE_CLOUD_STORAGE=true)
./docker-run.sh --local-storage

# Force GCS (even if .env says USE_CLOUD_STORAGE=false)
./docker-run.sh --gcs

# For local development with GCS testing
./docker-run.sh --mount-gcloud --gcs
```

