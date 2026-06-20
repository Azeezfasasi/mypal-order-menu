# #!/bin/bash

# # ============================================================================
# # MANUAL DEPLOYMENT SCRIPT (For Emergency Use Only)
# # Use this if GitHub Actions deployment fails
# # ============================================================================

# set -e

# echo "🚨 EMERGENCY MANUAL DEPLOYMENT"
# echo "This script will build and deploy manually"
# echo "Press Ctrl+C to cancel, or Enter to continue..."
# read

# # Configuration
# SERVER_HOST="your-server-ip"  # ⚠️ UPDATE THIS
# DEPLOY_USER="root"
# DEPLOY_PATH="/root/mypal/frontend/internal-admin"
# PM2_APP_NAME="internal-admin"

# # Build locally
# echo "📦 Building application..."
# pnpm install
# pnpm run build

# # Verify build
# if [ ! -d ".next/standalone" ]; then
#   echo "❌ Build failed - no standalone output"
#   exit 1
# fi

# # Create package
# echo "📦 Creating deployment package..."
# mkdir -p deploy-pkg

# cp -r .next/standalone/* deploy-pkg/
# mkdir -p deploy-pkg/.next
# cp -r .next/static deploy-pkg/.next/static

# [ -f ".next/build-manifest.json" ] && cp .next/build-manifest.json deploy-pkg/.next/
# [ -f ".next/routes-manifest.json" ] && cp .next/routes-manifest.json deploy-pkg/.next/

# [ -d "public" ] && cp -r public deploy-pkg/public
# cp ecosystem.config.js deploy-pkg/
# cp .env.production deploy-pkg/

# tar -czf deploy-manual.tar.gz -C deploy-pkg .
# rm -rf deploy-pkg

# echo "✅ Package created"

# # Upload
# echo "📤 Uploading to server..."
# scp deploy-manual.tar.gz ${DEPLOY_USER}@${SERVER_HOST}:/tmp/

# # Deploy
# echo "🚀 Deploying on server..."
# ssh ${DEPLOY_USER}@${SERVER_HOST} << ENDSSH
# set -e

# TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
# NEW_DIR="${DEPLOY_PATH}/releases/\${TIMESTAMP}"

# mkdir -p ${DEPLOY_PATH}/releases
# mkdir -p \${NEW_DIR}

# tar -xzf /tmp/deploy-manual.tar.gz -C \${NEW_DIR}
# rm /tmp/deploy-manual.tar.gz

# cd \${NEW_DIR}
# mkdir -p logs

# pm2 delete ${PM2_APP_NAME} 2>/dev/null || true
# rm -f ${DEPLOY_PATH}/current
# ln -sf \${NEW_DIR} ${DEPLOY_PATH}/current

# cd ${DEPLOY_PATH}/current
# pm2 start ecosystem.config.js
# pm2 save

# echo "✅ Deployed successfully"
# pm2 status

# ENDSSH

# # Cleanup
# rm -f deploy-manual.tar.gz

# echo ""
# echo "✅ Manual deployment complete!"
# echo "🌐 Check: https://internal.mypal-inc.com"
