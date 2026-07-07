#!/bin/bash

# PM2 Startup Script for Order-Reservation-Mgmt
set -e

# Get script directory (assumes script is inside /scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && cd .. && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting Order-Reservation-Mgmt with PM2..."
echo "📂 Working directory: $SCRIPT_DIR"

# Load environment file
# The CI/CD pipeline ensures .env.production exists in the root
if [ -f ".env.production" ]; then
    echo "📝 Loading environment from .env.production..."
    export $(grep -v '^#' .env.production | xargs)
else
    echo "⚠️  Warning: .env.production not found."
fi

# Ensure critical variables are set
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-4101}
export HOSTNAME=${HOSTNAME:-0.0.0.0}

echo "✅ Environment variables set:"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo "   HOSTNAME: $HOSTNAME"

# Verify critical variable
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo "❌ ERROR: NEXT_PUBLIC_API_URL is not set!"
    exit 1
fi

# Start PM2 with ecosystem config
echo "🔄 Starting PM2 using ecosystem.config.js..."
pm2 start ecosystem.config.js

echo "✅ Application started successfully!"
pm2 status
