#!/bin/bash

# Debug Deployment Script
# Run this on the server to diagnose deployment issues

DEPLOY_DIR="${1:-/root/mypal/frontend/internal-admin/deploy_20251110_121212}"

echo "🔍 Debugging deployment in: $DEPLOY_DIR"
echo ""

if [ ! -d "$DEPLOY_DIR" ]; then
  echo "❌ Directory does not exist: $DEPLOY_DIR"
  exit 1
fi

cd "$DEPLOY_DIR"

echo "📂 Directory structure:"
ls -la
echo ""

echo "📂 .next directory:"
if [ -d ".next" ]; then
  ls -la .next/
  echo ""
  if [ -d ".next/static" ]; then
    echo "✅ .next/static exists"
    ls -la .next/static/ | head -10
  else
    echo "❌ .next/static is MISSING"
  fi
else
  echo "❌ .next directory is MISSING"
fi
echo ""

echo "📄 server.js:"
if [ -f "server.js" ]; then
  echo "✅ server.js exists"
  echo "First 20 lines:"
  head -20 server.js
else
  echo "❌ server.js is MISSING"
fi
echo ""

echo "🔐 Environment files:"
if [ -f ".env.production" ]; then
  echo "✅ .env.production exists"
  echo "Variables (values hidden):"
  grep -v '^#' .env.production | cut -d= -f1 | grep -v '^$'
else
  echo "❌ .env.production is MISSING"
fi

if [ -f ".env.local" ]; then
  echo "✅ .env.local exists"
  echo "Variables (values hidden):"
  grep -v '^#' .env.local | cut -d= -f1 | grep -v '^$'
else
  echo "⚠️  .env.local does not exist (will be created during deployment)"
fi
echo ""

echo "📦 node_modules:"
if [ -d "node_modules" ]; then
  echo "✅ node_modules exists"
  echo "Size: $(du -sh node_modules 2>/dev/null | cut -f1)"
else
  echo "❌ node_modules is MISSING"
fi
echo ""

echo "📋 PM2 logs:"
if [ -d "logs" ]; then
  echo "Error log (last 30 lines):"
  tail -30 logs/error.log 2>/dev/null || echo "No error log found"
  echo ""
  echo "Output log (last 30 lines):"
  tail -30 logs/out.log 2>/dev/null || echo "No output log found"
else
  echo "⚠️  No logs directory"
fi
echo ""

echo "🔧 PM2 status:"
pm2 status

echo ""
echo "💡 To check PM2 logs for internal-admin:"
echo "   pm2 logs internal-admin --lines 50"
echo ""
echo "💡 To restart:"
echo "   cd $DEPLOY_DIR"
echo "   bash start-pm2.sh"
