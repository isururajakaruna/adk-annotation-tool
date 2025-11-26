#!/bin/bash

# Feedback Workbench - Run Script

echo "🚀 Starting Feedback Workbench..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Creating from .env.example..."
    cp .env.example .env
    echo "   ✅ Created .env file"
    echo "   ⚠️  Please update the values in .env before continuing"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to exit..."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check gcloud authentication
echo "🔐 Checking Google Cloud authentication..."
if gcloud auth application-default print-access-token > /dev/null 2>&1; then
    echo "   ✅ Authenticated with Google Cloud"
else
    echo "   ⚠️  Not authenticated with Google Cloud"
    echo "   Run: gcloud auth application-default login"
    echo ""
    read -p "Press Enter to continue anyway or Ctrl+C to exit..."
fi

echo ""
echo "🌐 Starting development server on http://localhost:3001"
echo "   Health check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the dev server
npm run dev
