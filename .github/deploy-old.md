name: Deploy to Digital Ocean Droplet

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Restore npm and Next.js cache
        uses: actions/cache@v4
        with:
          path: |
            ~/.npm
            ${{ github.workspace }}/.next/cache
          key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx') }}
          restore-keys: |
            ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci --legacy-peer-deps

      # - name: Build application with memory limit
      #   run: NODE_OPTIONS='--max-old-space-size=6144' npm run build
      #   env:
      #     NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}

      # Before build
      - name: Show available memory
        run: free -h

      # Build application
      - name: Build application
        run: NODE_OPTIONS="--max-old-space-size=3096" npm run build

      # Check if app builds and runs
      - name: Check if app builds and runs
        run: |
          npm start &
          sleep 10
          if ! pgrep -f "npm start" > /dev/null; then
            echo "❌ App did not start successfully!"; exit 1;
          fi
          pkill -f "npm start"

      # Deploy frontend to Droplet via SSH
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.PRIVATE_KEY }}
          script: |
            set -e  # Exit on any error
            echo "🚀 Starting deployment..."

            # Ensure deployment directory exists
            mkdir -p ~/mypal/frontend/business-frontend

            # Navigate to deployment directory
            cd ~/mypal/frontend/business-frontend || { echo "❌ Failed to navigate to deployment directory"; exit 1; }

            # Set memory limit
            export NODE_OPTIONS="--max-old-space-size=2096"

            # Initialize git if needed
            if [ ! -d .git ]; then
              echo "🔧 Initializing git repository..."
              git init -b main
              git remote add origin git@github.com:MiPal-dev/business-admin.git
            fi

            # Backup existing files
            cp .env.production .env.production.backup 2>/dev/null || true

            # Pull latest changes
            echo "📥 Pulling latest changes..."
            git fetch origin main
            git reset --hard origin/main

            # Install dependencies
            echo "📦 Installing dependencies..."
            npm ci --legacy-peer-deps

            # Create production environment
            echo "🔧 Setting up environment variables..."
            cat > .env.production << 'ENV_EOF'
            NODE_ENV=production
            NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL }}
            NEXT_PUBLIC_API_KEY=${{ secrets.NEXT_PUBLIC_API_KEY }}
            NEXT_PUBLIC_FIREBASE_API_KEY=${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
            NEXT_PUBLIC_FIREBASE_PROJECT_ID=${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
            NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }}
            NEXT_PUBLIC_FIREBASE_APP_ID=${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}
            NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${{ secrets.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID }}
            NEXT_PUBLIC_VAPID_PUBLIC_KEY=${{ secrets.NEXT_PUBLIC_VAPID_PUBLIC_KEY }}
            ENV_EOF

            # Create PM2 ecosystem config
            echo "🔧 Creating PM2 configuration..."
            cat > ecosystem.config.js << 'PM2_EOF'
            module.exports = {
              apps: [
                {
                  name: 'mypal-business-frontend',
                  script: 'npm',
                  args: 'start',
                  cwd: '/root/mypal/frontend/business-frontend',
                  instances: 1,
                  exec_mode: 'fork',
                  autorestart: true,
                  watch: false, // Disable watch mode to avoid deployment conflicts
                  max_memory_restart: '1G',
                  env: {
                    NODE_ENV: 'production',
                    PORT: 3002,
                    NODE_OPTIONS: '--max-old-space-size=2096',
                    NEXT_PUBLIC_API_URL: '${{ secrets.NEXT_PUBLIC_API_URL }}',
                    NEXT_PUBLIC_API_KEY: '${{ secrets.NEXT_PUBLIC_API_KEY }}',
                    NEXT_PUBLIC_FIREBASE_API_KEY: '${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}',
                    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: '${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}',
                    NEXT_PUBLIC_FIREBASE_PROJECT_ID: '${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}',
                    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }}',
                    NEXT_PUBLIC_FIREBASE_APP_ID: '${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}',
                    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: '${{ secrets.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID }}',
                    NEXT_PUBLIC_VAPID_PUBLIC_KEY: '${{ secrets.NEXT_PUBLIC_VAPID_PUBLIC_KEY }}',
                  }
                }
              ]
            };
            PM2_EOF

            # Install PM2 if needed
            if ! command -v pm2 &> /dev/null; then
              echo "📦 Installing PM2..."
              npm install -g pm2
            fi

            # Before build - check memory and disk space
            echo "🔍 System resources before build:"
            free -h
            df -h
            echo "📊 Current PM2 processes:"
            pm2 list 2>/dev/null || echo "No PM2 processes running"

            # Build application FIRST (before touching PM2)
            echo "🔨 Building application..."

            # Monitor memory during build
            (
              while kill -0 $$ 2>/dev/null; do
                free -m | grep "Mem:" | awk '{printf "Memory: %d/%d MB (%.1f%%)\n", $3, $2, $3/$2*100}'
                sleep 30
              done
            ) &
            MONITOR_PID=$!

            NODE_OPTIONS="--max-old-space-size=2096" npm run build
            BUILD_EXIT_CODE=$?

            # Stop memory monitor
            kill $MONITOR_PID 2>/dev/null || true

            # Check build result
            if [ $BUILD_EXIT_CODE -ne 0 ]; then
              echo "❌ Build failed with exit code $BUILD_EXIT_CODE"
              echo "🔍 System resources after failed build:"
              free -h
              df -h
              echo "🔄 Current app status:"
              pm2 status mypal-business-frontend || echo "No app currently running"
              exit 1
            fi

            # Check if build succeeded - EXIT EARLY if it fails
            if [ $? -ne 0 ]; then
              echo "❌ Build failed - keeping current app running"
              echo "🔄 Current app status:"
              pm2 status mypal-business-frontend || echo "No app currently running"
              exit 1
            fi

            echo "✅ Build completed successfully"

            # Only deploy if build succeeded
            echo "🔄 Deploying with PM2..."

            # Store current PM2 status for potential rollback
            pm2 describe mypal-business-frontend > /tmp/pm2-status-before.json 2>/dev/null || echo "No previous app running"

            # Try to reload/start the application
            if pm2 describe mypal-business-frontend > /dev/null 2>&1; then
              echo "📦 Reloading existing application..."
              pm2 reload mypal-business-frontend --update-env
            else
              echo "🚀 Starting new application..."
              pm2 start ecosystem.config.js
            fi

            pm2 save

            # Enhanced health check with timeout
            echo "🔍 Performing health check..."
            HEALTH_CHECK_COUNT=0
            MAX_HEALTH_CHECKS=6

            while [ $HEALTH_CHECK_COUNT -lt $MAX_HEALTH_CHECKS ]; do
              sleep 5
              HEALTH_CHECK_COUNT=$((HEALTH_CHECK_COUNT + 1))
              
              if pm2 list | grep -q "mypal-business-frontend.*online"; then
                echo "✅ Health check $HEALTH_CHECK_COUNT/$MAX_HEALTH_CHECKS: App is online"
                
                # Test HTTP response
                if curl -f -s http://localhost:3002 > /dev/null; then
                  echo "✅ HTTP health check passed"
                  echo "✅ Deployment successful!"
                  echo "🌐 Application is running on port 3002"
                  pm2 status mypal-business-frontend
                  exit 0
                else
                  echo "⚠️  App is online but not responding to HTTP requests"
                fi
              else
                echo "❌ Health check $HEALTH_CHECK_COUNT/$MAX_HEALTH_CHECKS: App is not online"
              fi
            done

            # If we get here, deployment failed
            echo "❌ Deployment failed after $MAX_HEALTH_CHECKS health checks!"
            echo "📋 PM2 Status:"
            pm2 status mypal-business-frontend
            echo "📋 Recent Logs:"
            pm2 logs mypal-business-frontend --lines 20

            # Attempt rollback by restarting with previous config
            echo "🔄 Attempting to restart application..."
            pm2 restart mypal-business-frontend
            sleep 10

            if pm2 list | grep -q "mypal-business-frontend.*online"; then
              echo "✅ Application restarted successfully"
            else
              echo "❌ Rollback failed - manual intervention required"
            fi

            exit 1
