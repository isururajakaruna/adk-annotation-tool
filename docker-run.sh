#!/bin/bash

# Feedback Workbench - Docker Run Script

IMAGE_NAME="feedback-workbench"
IMAGE_TAG="latest"
CONTAINER_NAME="feedback-workbench-app"
MOUNT_GCLOUD=false
ADDITIONAL_ENV_VARS=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --mount-gcloud)
      MOUNT_GCLOUD=true
      shift
      ;;
    --env)
      ADDITIONAL_ENV_VARS="$ADDITIONAL_ENV_VARS -e $2"
      shift 2
      ;;
    -t|--tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--mount-gcloud] [--env KEY=VALUE] [--tag TAG]"
      echo ""
      echo "Options:"
      echo "  --mount-gcloud        Mount gcloud credentials into container"
      echo "  --env KEY=VALUE       Add additional environment variable"
      echo "  --tag TAG            Use specific image tag (default: latest)"
      exit 1
      ;;
  esac
done

echo "🐳 Starting Feedback Workbench in Docker..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️  Warning: .env file not found!"
  echo "   Creating from .env.example..."
  cp .env.example .env
  echo "   ✅ Created .env file"
  echo "   ⚠️  Please update the values in .env with your Agent Engine configuration"
  echo ""
  read -p "Press Enter to continue or Ctrl+C to exit and configure .env first..."
fi

# Load PORT from .env (default to 3001 if not set)
if [ -f .env ]; then
  export $(grep "^PORT=" .env | xargs)
fi
PORT=${PORT:-3001}

FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

# Check gcloud auth if mounting credentials
if [ "$MOUNT_GCLOUD" = true ]; then
  echo "🔐 Checking gcloud authentication..."
  if ! command -v gcloud &> /dev/null; then
    echo "   ⚠️  gcloud CLI not found!"
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
  fi
  
  if ! gcloud auth application-default print-access-token > /dev/null 2>&1; then
    echo "   ⚠️  Not authenticated with gcloud"
    echo "   Run: gcloud auth application-default login"
    exit 1
  fi
  
  echo "   ✅ gcloud authenticated"
  
  # Check if gcloud config directory exists
  GCLOUD_CONFIG_DIR="$HOME/.config/gcloud"
  if [ ! -d "$GCLOUD_CONFIG_DIR" ]; then
    echo "   ⚠️  gcloud config directory not found: $GCLOUD_CONFIG_DIR"
    exit 1
  fi
fi

# Check if container is already running
if [ "$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
  echo "⚠️  Container '${CONTAINER_NAME}' is already running"
  echo "   Stopping existing container..."
  docker stop ${CONTAINER_NAME}
  docker rm ${CONTAINER_NAME}
fi

# Check if stopped container exists
if [ "$(docker ps -aq -f name=${CONTAINER_NAME})" ]; then
  echo "🗑️  Removing stopped container..."
  docker rm ${CONTAINER_NAME}
fi

echo "🚀 Starting container: ${CONTAINER_NAME}"
echo "   Image: ${FULL_IMAGE_NAME}"
echo "   Port: ${PORT}"
if [ "$MOUNT_GCLOUD" = true ]; then
  echo "   Auth: gcloud credentials mounted"
fi
if [ -n "$ADDITIONAL_ENV_VARS" ]; then
  echo "   Additional env vars: $ADDITIONAL_ENV_VARS"
fi
echo ""

# Build docker run command
DOCKER_RUN_CMD="docker run -d \
  --name ${CONTAINER_NAME} \
  -p ${PORT}:${PORT} \
  --env-file .env"

# Add gcloud mount if requested
if [ "$MOUNT_GCLOUD" = true ]; then
  DOCKER_RUN_CMD="$DOCKER_RUN_CMD \
  -v $HOME/.config/gcloud:/home/nextjs/.config/gcloud:ro \
  -e GOOGLE_APPLICATION_CREDENTIALS=/home/nextjs/.config/gcloud/application_default_credentials.json"
fi

# Add additional environment variables
if [ -n "$ADDITIONAL_ENV_VARS" ]; then
  DOCKER_RUN_CMD="$DOCKER_RUN_CMD $ADDITIONAL_ENV_VARS"
fi

# Add volume mounts and image name
DOCKER_RUN_CMD="$DOCKER_RUN_CMD \
  -v $(pwd)/conversations_saved:/app/conversations_saved \
  ${FULL_IMAGE_NAME}"

# Run the Docker container
eval $DOCKER_RUN_CMD

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Container started successfully!"
  echo ""
  echo "🌐 Application available at: http://localhost:${PORT}"
  echo "   Health check: http://localhost:${PORT}/api/health"
  echo ""
  echo "📋 Useful commands:"
  echo "   View logs:    docker logs -f ${CONTAINER_NAME}"
  echo "   Stop:         docker stop ${CONTAINER_NAME}"
  echo "   Restart:      docker restart ${CONTAINER_NAME}"
  echo "   Remove:       docker rm -f ${CONTAINER_NAME}"
  echo "   Shell:        docker exec -it ${CONTAINER_NAME} sh"
  echo ""
else
  echo ""
  echo "❌ Failed to start container"
  exit 1
fi

