# #!/bin/bash

# # PM2 Startup Script with Environment Variable Loading
# set -e

# # Get script directory
# SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# cd "$SCRIPT_DIR"

# echo "🚀 Starting application with PM2..."
# echo "📂 Working directory: $SCRIPT_DIR"

# # Function to load env file
# load_env_file() {
#   local file=$1
#   if [ -f "$file" ]; then
#     echo "📝 Loading environment from $file..."
#     # Use set -a to automatically export variables
#     set -a
#     source "$file"
#     set +a
#     return 0
#   else
#     echo "⚠️  Warning: $file not found"
#     return 1
#   fi
# }

# # Load environment files (order matters - .env.local overrides .env.production)
# load_env_file ".env.production"
# load_env_file ".env.local"

# # Ensure required variables are set
# export NODE_ENV=${NODE_ENV:-production}
# export PORT=${PORT:-4000}
# export HOSTNAME=${HOSTNAME:-0.0.0.0}

# echo "✅ Environment variables loaded"
# echo "   NODE_ENV: $NODE_ENV"
# echo "   PORT: $PORT"
# echo "   HOSTNAME: $HOSTNAME"

# # Verify critical variable
# if [ -z "$NEXT_PUBLIC_API_URL" ]; then
#   echo "❌ ERROR: NEXT_PUBLIC_API_URL is not set!"
#   echo "This is required for the application to work correctly."
#   exit 1
# fi

# echo "   NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"

# # Start PM2 with ecosystem config
# echo "🔄 Starting PM2..."
# pm2 start ecosystem.config.js

# echo "✅ Application started successfully!"
# pm2 status