#!/bin/bash

# Feedback Workbench - Docker Run Script

IMAGE_NAME="feedback-workbench"
IMAGE_TAG="latest"
CONTAINER_NAME="feedback-workbench-app"

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
echo ""

# Run the Docker container
docker run -d \
  --name ${CONTAINER_NAME} \
  -p ${PORT}:${PORT} \
  --env-file .env \
  -v "$(pwd)/conversations_saved:/app/conversations_saved" \
  ${FULL_IMAGE_NAME}

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
  echo ""
else
  echo ""
  echo "❌ Failed to start container"
  exit 1
fi

