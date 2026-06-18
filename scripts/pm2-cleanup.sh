#!/bin/bash

# PM2 Cleanup Script
# Run this on your server to clean up errored processes

echo "🧹 Cleaning up PM2 processes..."

# Delete all business-admin related processes
echo "Stopping and deleting business-admin processes..."
pm2 delete business-admin 2>/dev/null || echo "No business-admin found"
pm2 delete business-admin-new 2>/dev/null || echo "No business-admin-new found"

# Delete the test ecosystem processes
echo "Stopping and deleting test processes..."
pm2 delete ecosystem.test 2>/dev/null || echo "No ecosystem.test found"

# Clean up PM2 list (removes errored/stopped processes)
echo "Cleaning PM2 list..."
pm2 cleardump
pm2 save --force

echo "✅ Cleanup complete!"
echo ""
echo "Current PM2 status:"
pm2 status
