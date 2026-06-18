name: Deploy to Digital Ocean Droplet

Here’s how to update both PM2 config and CI workflow to run your Next.js app using the standalone build:

---

### 1. Update PM2 ecosystem.config.js

Point PM2 to the standalone server file:

```js
module.exports = {
  apps: [
    {
      name: "mypal-business-frontend",
      script: "./.next/standalone/server.js", // <--- Use standalone server
      cwd: "/root/mypal/frontend/business-frontend",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      },
    },
  ],
};
```

---

### 2. Update your CI workflow (GitHub Actions)

After building, deploy the full repo as usual, but PM2 will now run the standalone server.

**Example steps:**

```yaml
- name: Build application
  run: NODE_OPTIONS="--max-old-space-size=2096" npm run build

# Deploy frontend to Droplet via SSH
- name: Deploy to server
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.USERNAME }}
    key: ${{ secrets.PRIVATE_KEY }}
    script: |
      set -e
      cd ~/mypal/frontend/business-frontend
      git fetch origin main
      git reset --hard origin/main
      npm ci --legacy-peer-deps
      NODE_OPTIONS="--max-old-space-size=2096" npm run build

      # PM2 will now use the standalone server.js
      pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
      pm2 save
```

---

**Summary:**

- PM2 should run server.js (not `npm start`).
- Your CI/deploy script builds as usual, but runtime is now the standalone output.
- No need to change your build or deploy steps—just update the PM2 config.

### 3. Full code

Here is a ready-to-copy configuration for deploying and running your Next.js app using the standalone build with PM2:

```yaml
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

      - name: Show available memory
        run: free -h

      - name: Build application
        run: NODE_OPTIONS="--max-old-space-size=3096" npm run build

      - name: Check if standalone server runs
        run: |
          node .next/standalone/server.js &
          sleep 10
          if ! pgrep -f ".next/standalone/server.js" > /dev/null; then
            echo "❌ Standalone server did not start successfully!"; exit 1;
          fi
          pkill -f ".next/standalone/server.js"

      - name: Deploy frontend to Droplet via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.PRIVATE_KEY }}
          script: |
            set -e
            echo "🚀 Starting deployment..."

            mkdir -p ~/mypal/frontend/business-frontend
            cd ~/mypal/frontend/business-frontend || { echo "❌ Failed to navigate to deployment directory"; exit 1; }

            # Initialize git if needed
            if [ ! -d .git ]; then
              echo "🔧 Initializing git repository..."
              git init -b main
              git remote add origin git@github.com:MiPal-dev/business-admin.git
            fi

            cp .env.production .env.production.backup 2>/dev/null || true

            echo "📥 Pulling latest changes..."
            git fetch origin main
            git reset --hard origin/main

            echo "📦 Installing dependencies..."
            npm ci --legacy-peer-deps

            echo "🔨 Building application..."
            NODE_OPTIONS="--max-old-space-size=2096" npm run build

            # Create PM2 ecosystem config for standalone
            echo "🔧 Creating PM2 configuration for standalone..."
            cat > ecosystem.config.js << 'PM2_EOF'
            module.exports = {
              apps: [
                {
                  name: 'mypal-business-frontend',
                  script: './.next/standalone/server.js',
                  cwd: '/root/mypal/frontend/business-frontend',
                  instances: 1,
                  exec_mode: 'fork',
                  autorestart: true,
                  watch: false,
                  max_memory_restart: '1G',
                  env: {
                    NODE_ENV: 'production',
                    PORT: 3002,
                    NEXT_PUBLIC_API_URL: '${{ secrets.NEXT_PUBLIC_API_URL }}',
                  }
                }
              ]
            };
            PM2_EOF

            echo "🔄 Deploying with PM2..."
            pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
            pm2 save

            echo "🔍 Performing health check..."
            sleep 15
            if pm2 list | grep -q "mypal-business-frontend.*online"; then
              echo "✅ Deployment successful!"
              echo "🌐 Application is running on port 3002"
              pm2 status mypal-business-frontend
            else
              echo "❌ Deployment failed!"
              pm2 logs mypal-business-frontend --lines 20
              exit 1
            fi
```

**Key changes:**

- The build and run check uses the standalone server: `node .next/standalone/server.js`
- PM2 is configured to run the standalone server, not `npm start`.
- No need for `npm start` in production—use the built server.js.

This config is ready to use for your Next.js standalone deployment!
