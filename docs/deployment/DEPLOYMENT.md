# Internal Admin Deployment Guide

## Overview

This project uses GitHub Actions for CI/CD with automated deployment to DigitalOcean. The deployment supports both **standalone** (pnpm) and **standard** (npm) Next.js builds with PM2 process management.

## Table of Contents

- [Deployment Workflows](#deployment-workflows)
- [Server Requirements](#server-requirements)
- [Memory Optimization](#memory-optimization)
- [PM2 Ecosystem Configuration](#pm2-ecosystem-configuration)
- [Backup Management](#backup-management)
- [Troubleshooting](#troubleshooting)

---

## Deployment Workflows

### 1. Standalone Deployment (deploy.yml) - **Recommended**

- Uses **pnpm** package manager
- Next.js standalone build (smaller footprint)
- Optimized for production with minimal dependencies
- **Branch:** `main` or `dev`

### 2. Standard Deployment (nextjs_deploy_workflow_standard.yml)

- Uses **npm** package manager
- Traditional Next.js build
- **Branch:** `main` or `development`

### Auto-Merge Feature

Both workflows support auto-merge from development → main:

```bash
git commit -m "feat: new feature [merge-to-main]"
```

This will automatically merge, test, and deploy to production.

---

## Server Requirements

### Minimum Specifications

- **RAM:** 1GB (2GB recommended)
- **Swap:** 2-3GB (critical for low RAM environments)
- **Disk:** 10GB free space minimum
- **OS:** Ubuntu 20.04+ or Debian 11+
- **Node.js:** v20.x
- **PM2:** Latest version

### Required Software

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
npm install -g pm2

# PNPM (for standalone builds)
npm install -g pnpm@latest
```

### Swap Configuration (Critical for Low RAM)

If you have **less than 2GB RAM** or are running **multiple applications**, configure swap:

```bash
# Check current swap
free -h

# Create 3GB swap file (adjust size as needed)
sudo fallocate -l 3G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Configure swappiness (how aggressively to use swap)
# Lower = less swap usage, Higher = more swap usage
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# Verify
free -h
```

**Swap Size Recommendations:**

- 1GB RAM + 1 project = 2GB swap
- 1GB RAM + 2-3 projects = 3-4GB swap
- 2GB RAM + multiple projects = 2-3GB swap

**Monitoring Swap Usage:**

```bash
# Real-time monitoring
watch -n 1 free -h

# Check which processes use swap
for file in /proc/*/status ; do awk '/VmSwap|Name/{printf $2 " " $3}END{ print ""}' $file; done | sort -k 2 -n -r | less

# PM2 memory monitoring
pm2 monit
```

---

## PM2 Ecosystem Configuration

The deployment now uses `ecosystem.config.js` for optimized PM2 process management.

### Configuration File (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: "internal-admin",
      script: "./server.js",
      instances: 1, // Single instance for low RAM
      exec_mode: "fork", // Fork mode uses less memory than cluster
      max_memory_restart: "400M", // Auto-restart if memory exceeds 400MB
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        HOSTNAME: "0.0.0.0",
      },
      // Memory optimization
      node_args: "--max-old-space-size=512", // Limit Node.js heap to 512MB
      // Logging
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
```

### Memory Optimization Settings

**For 1-2GB RAM environments:**

- `max_memory_restart: "400M"` - Restart if app uses >400MB
- `node_args: "--max-old-space-size=512"` - Limit heap to 512MB
- `instances: 1` - Single process (cluster mode uses more RAM)
- `exec_mode: "fork"` - Fork mode is lighter than cluster

**For 4GB+ RAM environments:**

```javascript
max_memory_restart: "1G",
node_args: "--max-old-space-size=2048",
instances: 2, // Can run multiple instances
exec_mode: "cluster",
```

### PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js

# Restart
pm2 restart internal-admin

# Stop
pm2 stop internal-admin

# View logs
pm2 logs internal-admin

# Monitor resources
pm2 monit

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
```

---

## Backup Management

### Current Configuration

The deployment creates **lightweight backups** to save disk space:

- **Deploy directories kept:** 2 most recent
- **Backup directories kept:** 2 most recent
- **Backup exclusions:** `node_modules`, `logs` (saves ~200-500MB per backup)

### Why Exclude `node_modules`?

- **Saves 200-500MB per backup**
- `node_modules` are reinstalled during rollback if missing
- Source of truth is `package.json` + lock file
- Prevents disk space issues on small servers

### Backup Size Comparison

```
With node_modules:    ~350-600MB per backup
Without node_modules: ~50-100MB per backup
```

### Disk Space Strategy

**For servers with limited disk space (<20GB):**

```bash
# Current settings (in workflow)
Keep 2 deploy directories  # ~700MB-1.2GB total
Keep 2 backups            # ~100-200MB total
Total: ~1-1.5GB
```

**To adjust retention:**
Edit `.github/workflows/deploy.yml` line ~288:

```bash
# Keep more/less deployments
ls -dt deploy_* 2>/dev/null | tail -n +3 | xargs -r rm -rf  # Change +3 to +4 for 3 deploys
ls -dt backup_* 2>/dev/null | tail -n +3 | xargs -r rm -rf  # Change +3 to +4 for 3 backups
```

### Manual Cleanup

```bash
# Check disk usage
cd /root/mypal/frontend/internal-admin
du -sh deploy_* backup_*

# Manually remove old deployments
rm -rf deploy_YYYYMMDD_HHMMSS

# Emergency cleanup (keep only current)
find . -maxdepth 1 -type d -name "deploy_*" ! -name "$(readlink -f current | xargs basename)" -exec rm -rf {} \;
```

---

## Deployment Directory Structure

```
/root/mypal/frontend/internal-admin/
├── current -> deploy_20251109_070247/    # Symlink to active deployment
├── deploy_20251109_070247/               # Current deployment
│   ├── server.js
│   ├── .env.production
│   ├── ecosystem.config.js
│   ├── node_modules/                     # Production dependencies
│   ├── .next/
│   ├── public/
│   └── logs/
├── deploy_20251108_143022/               # Previous deployment
├── backup_20251109_070247/               # Lightweight backup (no node_modules)
│   ├── server.js
│   ├── .env.production
│   ├── ecosystem.config.js
│   └── .next/
└── backup_20251108_143022/               # Previous backup
```

---

## GitHub Secrets Configuration

Required secrets in GitHub repository settings:

| Secret Name          | Description                                 | Example                                  |
| -------------------- | ------------------------------------------- | ---------------------------------------- |
| `DEPLOY_KEY`         | SSH private key for server access           | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_HOST`        | Server IP or hostname                       | `123.45.67.89`                           |
| `INTERNAL_ADMIN_ENV` | Production environment variables            | `DATABASE_URL=...`                       |
| `SLACK_WEBHOOK_URL`  | (Optional) Slack notifications              | `https://hooks.slack.com/...`            |
| `PAT_TOKEN`          | GitHub Personal Access Token for auto-merge | `ghp_...`                                |

---

## Troubleshooting

### 1. 502 Bad Gateway Error

**Symptoms:**

- Deployment succeeds but site shows 502
- `curl http://localhost:4000` fails

**Diagnosis:**

```bash
# SSH to server
ssh root@your-server

# Check PM2 status
pm2 status

# Check logs
pm2 logs internal-admin --lines 50

# Check if port is in use
lsof -i :4000
netstat -tulpn | grep 4000
```

**Common Causes:**

1. **Port conflict** - Another service using port 4000

   ```bash
   # Find what's using the port
   lsof -i :4000

   # Kill the process or change port in ecosystem.config.js
   ```

2. **Environment variables not loaded**

   ```bash
   # Check .env.production exists
   cd /root/mypal/frontend/internal-admin/current
   cat .env.production

   # Restart with ecosystem config
   pm2 delete internal-admin
   pm2 start ecosystem.config.js
   ```

3. **Memory issues**

   ```bash
   # Check available memory
   free -h

   # Check if app is being killed by OOM
   dmesg | grep -i "out of memory"

   # Add swap if needed (see Swap Configuration section)
   ```

### 2. Out of Memory (OOM) Issues

**Symptoms:**

- PM2 shows app restarting frequently
- Server becomes unresponsive
- `dmesg` shows OOM killer messages

**Solutions:**

```bash
# 1. Check memory usage
free -h
pm2 monit

# 2. Add/increase swap (see Swap Configuration section)

# 3. Reduce Node.js memory limit in ecosystem.config.js
# Change: node_args: "--max-old-space-size=512" to "--max-old-space-size=384"

# 4. Enable max_memory_restart
# Edit ecosystem.config.js: max_memory_restart: "300M"

# 5. Stop unnecessary services
systemctl list-units --type=service --state=running
```

### 3. Disk Space Full

**Symptoms:**

- Deployment fails with "No space left on device"
- Cannot write logs

**Solutions:**

```bash
# 1. Check disk usage
df -h
du -sh /root/mypal/frontend/internal-admin/*

# 2. Clean old deployments manually
cd /root/mypal/frontend/internal-admin
ls -lt | head -20
rm -rf deploy_YYYYMMDD_HHMMSS  # Remove old deploys

# 3. Clean PM2 logs
pm2 flush  # Clear all logs
pm2 install pm2-logrotate  # Auto-rotate logs

# 4. Clean package manager caches
pnpm store prune  # Clean pnpm cache
npm cache clean --force  # Clean npm cache

# 5. Clean system caches
sudo apt-get clean
sudo apt-get autoclean
sudo journalctl --vacuum-time=7d  # Keep only 7 days of logs
```

### 4. Build Fails in GitHub Actions

**Symptoms:**

- Workflow fails at build step
- "ELIFECYCLE" or dependency errors

**Solutions:**

```bash
# 1. Lock file mismatch
# Delete and regenerate lock file locally:
rm pnpm-lock.yaml
pnpm install
git add pnpm-lock.yaml
git commit -m "fix: regenerate lock file"

# 2. Cache issues
# Clear GitHub Actions cache in repo settings → Actions → Caches

# 3. Node version mismatch
# Check .github/workflows/deploy.yml env.NODE_VERSION matches local
```

### 5. PM2 Not Starting After Reboot

**Symptoms:**

- Server restarts but PM2 apps don't start automatically

**Solutions:**

```bash
# Setup PM2 startup script
pm2 startup systemd -u root --hp /root

# This will output a command, run it:
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# Save current PM2 processes
pm2 save

# Test reboot
sudo reboot

# After reboot, verify
pm2 status
```

### 6. Environment Variables Not Loading

**Symptoms:**

- App starts but features don't work
- Database connection fails

**Solutions:**

```bash
# 1. Check .env.production exists and is populated
cd /root/mypal/frontend/internal-admin/current
cat .env.production

# 2. Verify environment in PM2
pm2 show internal-admin

# 3. Update GitHub secret INTERNAL_ADMIN_ENV and redeploy

# 4. Manually set critical env vars in ecosystem.config.js
```

---

## Performance Monitoring

### System Resources

```bash
# Real-time system monitoring
htop

# Memory usage
free -h
watch -n 2 free -h

# Disk I/O
iostat -x 2

# Network
iftop
```

### Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# Application logs
pm2 logs internal-admin --lines 100

# Error logs only
pm2 logs internal-admin --err

# Access logs
tail -f /var/log/nginx/internal.mypal-inc.com.access.log
```

### Setting Up Alerts

**PM2 Plus (formerly Keymetrics):**

```bash
pm2 install pm2-server-monit
pm2 set pm2-server-monit:threshold_cpu 80
pm2 set pm2-server-monit:threshold_mem 80
```

---

## Rollback Procedure

### Automatic Rollback (via GitHub Actions)

1. Go to GitHub Actions
2. Select workflow: "Internal Admin CI/CD with Rollback"
3. Click "Run workflow"
4. Select action: "rollback"
5. Confirm

### Manual Rollback

```bash
# SSH to server
ssh root@your-server

# Navigate to deployment directory
cd /root/mypal/frontend/internal-admin

# Check available backups
ls -lt backup_*

# Stop current app
pm2 stop internal-admin

# Restore backup
cp -r backup_20251108_143022 current

# Reinstall dependencies (backups don't include node_modules)
cd current
pnpm install --no-frozen-lockfile --prod

# Restart app
pm2 delete internal-admin
pm2 start ecosystem.config.js

# Verify
pm2 status
curl http://localhost:4000
```

---

## Best Practices

### 1. Regular Monitoring

- Check PM2 status daily: `pm2 status`
- Monitor disk space: `df -h`
- Review logs weekly: `pm2 logs internal-admin --lines 1000`

### 2. Backup Strategy

- Automated backups happen on each deployment
- Keep 2 deploy directories (current + 1 previous)
- Keep 2 lightweight backups (excluding node_modules)
- Manual backups before major changes

### 3. Deployment Schedule

- Deploy during low-traffic hours
- Test in development environment first
- Use auto-merge for tested features
- Monitor for 30 minutes after deployment

### 4. Resource Management

- Maintain at least 20% free disk space
- Keep swap usage below 50%
- Monitor memory usage trends
- Scale vertically if consistently above 80% RAM

### 5. Security

- Keep SSH keys secure
- Rotate deployment keys quarterly
- Update Node.js and PM2 regularly
- Review Nginx logs for suspicious activity

---

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Next.js Standalone Deployment](https://nextjs.org/docs/advanced-features/output-file-tracing)
- [DigitalOcean Server Optimization](https://www.digitalocean.com/community/tutorials/how-to-optimize-node-js-applications)
- [Linux Swap Management](https://linuxize.com/post/create-a-linux-swap-file/)

---

## Support

For deployment issues:

1. Check this troubleshooting guide
2. Review PM2 logs: `pm2 logs internal-admin`
3. Check GitHub Actions workflow logs
4. Contact DevOps team

**Emergency Contact:**

- Check system status: `pm2 status && free -h && df -h`
- Rollback if needed (see Rollback Procedure)
- Escalate if persistent issues
