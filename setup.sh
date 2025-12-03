#!/bin/bash

# Feedback Workbench - Setup Script

echo "🔧 Setting up Feedback Workbench..."
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required"
    echo "   Current version: $(node -v)"
    exit 1
fi
echo "   ✅ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "   ✅ npm $(npm -v)"

# Check gcloud
if ! command -v gcloud &> /dev/null; then
    echo "⚠️  gcloud CLI is not installed"
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
    echo "   This is required for Agent Engine authentication"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "   ✅ gcloud CLI installed"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "   ✅ Dependencies installed"

echo ""
echo "🏗️  Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "   ✅ Production build complete"

echo ""
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "   ✅ Created .env file from template"
    echo "   ⚠️  Please update the values in .env with your Agent Engine configuration:"
    echo "      - AGENT_ENGINE_PROJECT_ID"
    echo "      - AGENT_ENGINE_LOCATION"
    echo "      - AGENT_ENGINE_RESOURCE_ID"
else
    echo "   ⚠️  .env file already exists, skipping..."
fi

echo ""
echo "🔐 Google Cloud Authentication..."
if gcloud auth application-default print-access-token > /dev/null 2>&1; then
    echo "   ✅ Already authenticated with Google Cloud"
else
    echo "   ⚠️  Not authenticated with Google Cloud"
    echo "   Run the following command to authenticate:"
    echo "   $ gcloud auth application-default login"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your Agent Engine configuration"
echo "2. Authenticate with Google Cloud: gcloud auth application-default login"
echo "3. Run the production server: ./run.sh"
echo "   OR run in development mode: ./run.sh --dev"
echo ""
