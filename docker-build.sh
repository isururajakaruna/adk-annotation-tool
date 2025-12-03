#!/bin/bash

# Feedback Workbench - Docker Build Script

IMAGE_NAME="feedback-workbench"
IMAGE_TAG="latest"

echo "🐳 Building Docker image for Feedback Workbench..."
echo ""

# Parse command line arguments for custom tag
while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [-t|--tag TAG]"
      exit 1
      ;;
  esac
done

FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

echo "📦 Building image: ${FULL_IMAGE_NAME}"
echo ""

# Build the Docker image
docker build -t "${FULL_IMAGE_NAME}" .

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Docker image built successfully!"
  echo ""
  echo "Image: ${FULL_IMAGE_NAME}"
  echo ""
  echo "Next steps:"
  echo "1. Create a .env file with your configuration"
  echo "2. Run the container: ./docker-run.sh"
  echo "   OR manually: docker run -p 3001:3001 --env-file .env ${FULL_IMAGE_NAME}"
  echo ""
else
  echo ""
  echo "❌ Docker build failed"
  exit 1
fi

