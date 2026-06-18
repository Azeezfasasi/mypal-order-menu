# Quick Deployment Reference

## Current Server Configuration

**Server:** DigitalOcean Droplet (internal.mypal-inc.com)
**RAM:** ~1.9GB + 3GB Swap
**Projects:** Multiple (requires resource management)
**Path:** `/root/mypal/frontend/internal-admin`

## PM2 Ecosystem Config

✅ **Now Using:** `ecosystem.config.js` for all deployments

### Memory Limits (Low RAM Optimization)

```javascript
max_memory_restart: "400M"; // Auto-restart at 400MB
node_args: "--max-old-space-size=512"; // 512MB heap limit
instances: 1; // Single instance (not cluster)
```

## Backup Strategy

### Changed Settings

| Item                         | Old Value | New Value | Reason                  |
| ---------------------------- | --------- | --------- | ----------------------- |
| Deploy directories           | 3         | 2         | Save disk space         |
| Backup directories           | 5         | 2         | Save disk space         |
| Backup includes node_modules | Yes       | No        | Saves ~300MB per backup |
| Backup size                  | ~500MB    | ~80MB     | 85% reduction           |

### Current Retention

- **Deploy folders:** 2 (current + 1 previous) = ~1GB
- **Backup folders:** 2 (lightweight) = ~150MB
- **Total storage:** ~1.2GB vs ~3.5GB previously

## Deployment Changes

Both workflows now:

1. ✅ Include `ecosystem.config.js` in deployment package
2. ✅ Create lightweight backups (exclude node_modules + logs)
3. ✅ Use PM2 ecosystem for process management
4. ✅ Show memory usage after deployment
5. ✅ Auto-configure PM2 startup on reboot
6. ✅ Reinstall node_modules during rollback (if needed)

## Manual Deployment Commands (for reference)

### Start Application

```bash
cd /root/mypal/frontend/internal-admin/current
pm2 start ecosystem.config.js
pm2 save
```

### Rollback

```bash
cd /root/mypal/frontend/internal-admin
cp -r backup_TIMESTAMP current
cd current
pnpm install --no-frozen-lockfile --prod  # Reinstall dependencies
pm2 delete internal-admin
pm2 start ecosystem.config.js
```

### Monitor Resources

```bash
pm2 monit              # Real-time PM2 monitoring
free -h                # Memory usage
df -h                  # Disk usage
pm2 logs internal-admin --lines 50  # Application logs
```

## Key Files Updated

1. **ecosystem.config.js** (NEW)

   - PM2 process configuration
   - Memory limits
   - Environment variables

2. **.github/workflows/deploy.yml**

   - Includes ecosystem.config.js in package
   - Lightweight backups (no node_modules)
   - Keeps 2 deploys + 2 backups
   - Uses ecosystem for PM2 startup
   - Shows memory usage after deploy

3. **.github/workflows/nextjs_deploy_workflow_standard.yml**

   - Same changes as deploy.yml
   - For npm-based deployments

4. **DEPLOYMENT.md** (NEW)
   - Comprehensive deployment guide
   - Swap configuration instructions
   - Troubleshooting guide
   - Memory optimization tips

## Next Steps

### On Server

1. Verify swap is configured (3GB recommended):

   ```bash
   free -h  # Should show ~3GB swap
   ```

2. Current deployment should already work with ecosystem config
   ```bash
   pm2 status  # Check if internal-admin is running
   curl http://localhost:4000  # Test application
   ```

### Next Deployment

The next git push to `main` will:

1. Build with ecosystem.config.js included
2. Create lightweight backup of current deployment
3. Clean old deploys (keep only 2)
4. Deploy with PM2 ecosystem configuration
5. Show memory usage after deployment

## Troubleshooting Quick Commands

```bash
# App not starting
pm2 logs internal-admin --lines 50

# High memory usage
pm2 monit
free -h

# Disk space issues
df -h
du -sh /root/mypal/frontend/internal-admin/*

# Manual restart with ecosystem
cd /root/mypal/frontend/internal-admin/current
pm2 delete internal-admin
pm2 start ecosystem.config.js
```

## Documentation

See **DEPLOYMENT.md** for:

- Complete server setup guide
- Swap configuration
- Detailed troubleshooting
- Performance monitoring
- Best practices
