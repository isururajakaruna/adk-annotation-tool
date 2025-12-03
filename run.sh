#!/bin/bash

# Feedback Workbench - Run Script

# Parse command line arguments
MODE="production"
if [ "$1" == "--dev" ] || [ "$1" == "-d" ]; then
    MODE="development"
fi

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

# Check gcloud authentication (informational only)
echo "🔐 Checking Google Cloud authentication..."
if command -v gcloud &> /dev/null; then
    if gcloud auth application-default print-access-token > /dev/null 2>&1; then
        echo "   ✅ Authenticated with Google Cloud (gcloud)"
    else
        echo "   ℹ️  No gcloud credentials found"
        echo "   Will attempt to use Application Default Credentials (ADC)"
    fi
else
    echo "   ℹ️  gcloud not installed - using Application Default Credentials (ADC)"
fi

echo ""

# Start the appropriate server
if [ "$MODE" == "development" ]; then
    echo "🌐 Starting DEVELOPMENT server on http://localhost:3001"
    echo "   Health check: http://localhost:3001/api/health"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    npm run dev
else
    # Check if production build exists
    if [ ! -d ".next" ]; then
        echo "⚠️  Production build not found. Running build..."
        npm run build
        if [ $? -ne 0 ]; then
            echo "❌ Build failed"
            exit 1
        fi
        echo ""
    fi
    
    echo "🌐 Starting PRODUCTION server on http://localhost:3001"
    echo "   Health check: http://localhost:3001/api/health"
    echo ""
    echo "💡 Tip: Use './run.sh --dev' to start in development mode"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    npm run start
fi
