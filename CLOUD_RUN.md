# Cloud Run Deployment Guide

## Overview

Deploying Feedback Workbench to Google Cloud Run requires modifications because Cloud Run is a **stateless** platform:

### ✅ What Works Out of the Box
- **Authentication**: Service account credentials are automatically available
- **Agent Engine connectivity**: Direct communication works perfectly
- **Live chat**: Real-time streaming works
- **Annotations**: Inline editing, rating, commenting all work

### ❌ What Doesn't Work (Without Modifications)
- **Saved conversations**: Local filesystem is ephemeral - files are lost on restart
- **Volume mounts**: Cloud Run doesn't support persistent volumes
- **Logs**: Local log files are ephemeral

## Solution: Use Cloud Storage for Persistence

To make this work on Cloud Run, you need to:

### Option 1: Modify to Use Cloud Storage (Recommended for Production)

Replace local file storage (`conversations_saved/`) with Google Cloud Storage buckets.

**Required changes:**
1. Add `@google-cloud/storage` dependency
2. Update `src/app/api/conversations/save/route.ts` to write to GCS
3. Update `src/app/api/conversations/saved/route.ts` to read from GCS
4. Update `src/app/api/conversations/saved/[id]/route.ts` to read from GCS

**Example implementation:**

```typescript
// lib/storage.ts
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'feedback-workbench-conversations';
const bucket = storage.bucket(bucketName);

export async function saveConversation(id: string, data: any): Promise<void> {
  const file = bucket.file(`conversations/${id}.json`);
  await file.save(JSON.stringify(data, null, 2), {
    contentType: 'application/json',
  });
}

export async function listConversations(): Promise<any[]> {
  const [files] = await bucket.getFiles({ prefix: 'conversations/' });
  const conversations = await Promise.all(
    files.map(async (file) => {
      const [contents] = await file.download();
      return JSON.parse(contents.toString());
    })
  );
  return conversations;
}

export async function getConversation(id: string): Promise<any> {
  const file = bucket.file(`conversations/${id}.json`);
  const [contents] = await file.download();
  return JSON.parse(contents.toString());
}

export async function deleteConversation(id: string): Promise<void> {
  const file = bucket.file(`conversations/${id}.json`);
  await file.delete();
}
```

### Option 2: Accept Ephemeral Storage (Quick Deploy)

If you don't need persistence (e.g., for testing):
- Conversations will be lost on container restart
- Good for demos or development
- No code changes needed

**Trade-off:**
- ✅ Deploy immediately
- ❌ Lose all saved conversations on restart/redeploy
- ❌ Can't scale beyond 1 instance (each instance has separate storage)

## Deployment Steps

### Prerequisites

1. **Google Cloud Project** with billing enabled
2. **Enable APIs:**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   gcloud services enable aiplatform.googleapis.com
   ```

3. **Create GCS Bucket** (if using Option 1):
   ```bash
   gsutil mb -l us-central1 gs://feedback-workbench-conversations
   ```

### Step 1: Build and Push Container

```bash
# Set your project
export PROJECT_ID=your-project-id
export REGION=us-central1

# Configure Docker for Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Create Artifact Registry repository
gcloud artifacts repositories create feedback-workbench \
  --repository-format=docker \
  --location=${REGION}

# Build and tag image
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/feedback-workbench/app:latest .

# Push to Artifact Registry
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/feedback-workbench/app:latest
```

### Step 2: Deploy to Cloud Run

**Basic deployment (ephemeral storage):**
```bash
gcloud run deploy feedback-workbench \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/feedback-workbench/app:latest \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --port=3001 \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --set-env-vars="AGENT_ENGINE_PROJECT_ID=255766800726,AGENT_ENGINE_LOCATION=us-central1,AGENT_ENGINE_RESOURCE_ID=your-reasoning-engine-id,PORT=3001,NEXT_PUBLIC_APP_NAME=Feedback Workbench"
```

**With Cloud Storage (Option 1):**
```bash
gcloud run deploy feedback-workbench \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/feedback-workbench/app:latest \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --port=3001 \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --set-env-vars="AGENT_ENGINE_PROJECT_ID=255766800726,AGENT_ENGINE_LOCATION=us-central1,AGENT_ENGINE_RESOURCE_ID=your-reasoning-engine-id,PORT=3001,NEXT_PUBLIC_APP_NAME=Feedback Workbench,GCS_BUCKET_NAME=feedback-workbench-conversations,USE_CLOUD_STORAGE=true"
```

### Step 3: Configure Service Account Permissions

The Cloud Run service needs permissions to:
1. Access Agent Engine
2. Access Cloud Storage (if using Option 1)

```bash
# Get the service account email
SERVICE_ACCOUNT=$(gcloud run services describe feedback-workbench \
  --region=${REGION} \
  --format='value(spec.template.spec.serviceAccountName)')

# Grant Agent Engine permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user"

# Grant Cloud Storage permissions (if using Option 1)
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:objectAdmin \
  gs://feedback-workbench-conversations
```

## Architecture Comparison

### Local Docker (Current)
```
┌─────────────┐
│  Container  │
│  ┌────────┐ │
│  │  App   │ │
│  └────────┘ │
│  ┌────────┐ │
│  │ Local  │ │  ← Mounted volume (persistent)
│  │ Files  │ │
│  └────────┘ │
└─────────────┘
```

### Cloud Run (Ephemeral - Option 2)
```
┌─────────────┐
│  Container  │
│  ┌────────┐ │
│  │  App   │ │
│  └────────┘ │
│  ┌────────┐ │
│  │ Local  │ │  ← Ephemeral (lost on restart) ❌
│  │ Files  │ │
│  └────────┘ │
└─────────────┘
```

### Cloud Run (With GCS - Option 1)
```
┌─────────────┐      ┌──────────────────┐
│  Container  │      │   Cloud Storage  │
│  ┌────────┐ │      │   ┌────────────┐ │
│  │  App   │ │◄────►│   │conversation│ │
│  └────────┘ │      │   │   files    │ │
└─────────────┘      │   └────────────┘ │
                     │   (persistent) ✅ │
                     └──────────────────┘
```

## Advantages of Cloud Run

✅ **Auto-scaling**: Scales to zero when not in use, scales up automatically
✅ **No server management**: Fully managed platform
✅ **Cost-effective**: Pay only for actual usage (requests)
✅ **HTTPS included**: Automatic SSL/TLS certificates
✅ **Authentication**: Built-in service account credentials
✅ **Fast deployment**: Deploy in seconds
✅ **Rollback**: Easy to rollback to previous versions

## Limitations

❌ **Stateless**: No persistent local filesystem
❌ **Cold starts**: First request after idle may be slower
❌ **Request timeout**: Maximum 60 minutes
❌ **WebSocket limitations**: SSE works, but traditional WebSocket requires special handling
❌ **Instance limitations**: Each instance is isolated

## Cost Estimate

**Assuming:**
- 100 requests/day
- 2s average request duration
- 1GB memory
- us-central1 region

**Monthly cost:** ~$1-5 USD

**Breakdown:**
- Requests: 100/day × 30 = 3,000/month (well under free tier of 2M requests)
- Compute time: Free tier covers significant usage
- Cloud Storage: ~$0.02/GB/month
- Network egress: First 1GB free, then $0.12/GB

## Monitoring and Debugging

### View Logs
```bash
gcloud run services logs read feedback-workbench --region=${REGION}

# Stream logs in real-time
gcloud run services logs tail feedback-workbench --region=${REGION}
```

### View Metrics
```bash
# In Cloud Console
https://console.cloud.google.com/run/detail/${REGION}/feedback-workbench/metrics
```

### Test Deployment
```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe feedback-workbench \
  --region=${REGION} \
  --format='value(status.url)')

# Test health endpoint
curl ${SERVICE_URL}/api/health

# Test in browser
open ${SERVICE_URL}
```

## Continuous Deployment

### Using Cloud Build

Create `cloudbuild.yaml`:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - '${_REGION}-docker.pkg.dev/$PROJECT_ID/feedback-workbench/app:$COMMIT_SHA'
      - '-t'
      - '${_REGION}-docker.pkg.dev/$PROJECT_ID/feedback-workbench/app:latest'
      - '.'

  # Push the container image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '--all-tags'
      - '${_REGION}-docker.pkg.dev/$PROJECT_ID/feedback-workbench/app'

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'feedback-workbench'
      - '--image=${_REGION}-docker.pkg.dev/$PROJECT_ID/feedback-workbench/app:$COMMIT_SHA'
      - '--region=${_REGION}'
      - '--platform=managed'

substitutions:
  _REGION: us-central1

options:
  logging: CLOUD_LOGGING_ONLY
```

Deploy automatically on git push:
```bash
gcloud builds triggers create github \
  --repo-name=your-repo \
  --repo-owner=your-org \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

## Security Best Practices

1. **Use Secret Manager** for sensitive env vars:
   ```bash
   gcloud run services update feedback-workbench \
     --update-secrets=AGENT_ENGINE_PROJECT_ID=agent-project-id:latest
   ```

2. **Restrict access** with IAM:
   ```bash
   # Remove public access
   gcloud run services remove-iam-policy-binding feedback-workbench \
     --member="allUsers" \
     --role="roles/run.invoker" \
     --region=${REGION}

   # Add specific users
   gcloud run services add-iam-policy-binding feedback-workbench \
     --member="user:your-email@example.com" \
     --role="roles/run.invoker" \
     --region=${REGION}
   ```

3. **Use VPC connector** for private Agent Engine access
4. **Enable Cloud Armor** for DDoS protection
5. **Use Cloud CDN** for static assets

## Troubleshooting

### Container fails to start
- Check logs: `gcloud run services logs read feedback-workbench --region=${REGION}`
- Verify environment variables are set correctly
- Ensure service account has proper permissions

### Authentication errors
- Verify service account has `roles/aiplatform.user`
- Check `AGENT_ENGINE_*` environment variables
- Test Agent Engine connectivity from Cloud Shell

### Conversations not persisting
- This is expected with ephemeral storage (Option 2)
- Implement Cloud Storage integration (Option 1)
- Or use external database

### Slow response times
- Increase CPU/memory allocation
- Reduce cold start time with minimum instances:
  ```bash
  gcloud run services update feedback-workbench \
    --min-instances=1 \
    --region=${REGION}
  ```

## Next Steps

1. **Choose storage option**: Ephemeral vs Cloud Storage
2. **Implement GCS integration** (if needed)
3. **Deploy to Cloud Run**
4. **Test thoroughly**
5. **Set up monitoring and alerts**
6. **Configure CI/CD** (optional)
7. **Add custom domain** (optional)

## Reference

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Agent Engine Documentation](https://cloud.google.com/vertex-ai/docs/reasoning-engine)

