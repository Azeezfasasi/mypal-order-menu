# PM2 Ecosystem Configuration & Deployment Optimizations

## 🆕 Recent Updates (November 2024)

This document covers the **new PM2 ecosystem configuration** and **optimization strategies** implemented for low-RAM servers running multiple applications.

> **Related Docs:**
>
> - Main deployment guide: [`deployment_readme.md`](./deployment_readme.md)
> - Quick reference: [`../../DEPLOYMENT_QUICK_REF.md`](../../DEPLOYMENT_QUICK_REF.md)
> - Full optimization guide: [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md)

---

## Table of Contents

1. [PM2 Ecosystem Configuration](#pm2-ecosystem-configuration)
2. [Memory & Resource Management](#memory--resource-management)
3. [Backup Strategy Changes](#backup-strategy-changes)
4. [Troubleshooting PM2 Issues](#troubleshooting-pm2-issues)
5. [Recommendations](#recommendations)

---

## PM2 Ecosystem Configuration

### What Changed?

**Before:**

```bash
pm2 start npm --name internal-admin -- start -- -p 4000
# Problems:
# - Environment variables might not load
# - No memory limits (can crash server)
# - No structured logging
# - Manual configuration each deployment
```

**After:**

```bash
pm2 start ecosystem.config.js
# Benefits:
# - All settings in one configuration file
# - Memory limits prevent OOM crashes
# - Environment variables always correct
# - Automatic deployment integration
```

### Configuration File

The `ecosystem.config.js` file is now **automatically deployed** with every release:

```javascript
module.exports = {
  apps: [
    {
      name: "internal-admin",
      script: "./server.js",
      instances: 1, // Single instance for low RAM
      exec_mode: "fork", // Uses less memory than cluster
      max_memory_restart: "500M", // Restart at 500MB
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        HOSTNAME: "0.0.0.0",
      },
      // Memory optimization
      node_args: "--max-old-space-size=512", // 512MB heap limit
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

### Key Settings Explained

| Setting                                 | Value           | Why?                                       |
| --------------------------------------- | --------------- | ------------------------------------------ |
| `instances: 1`                          | Single instance | Low RAM servers can't handle cluster mode  |
| `exec_mode: "fork"`                     | Fork mode       | Uses less memory than cluster (important!) |
| `max_memory_restart: "500M"`            | 500MB limit     | Auto-restart before OOM crash              |
| `node_args: "--max-old-space-size=512"` | 512MB heap      | Prevents Node.js from using too much RAM   |
| `max_restarts: 10`                      | 10 attempts     | Prevents infinite restart loops            |
| `min_uptime: "10s"`                     | 10 seconds      | Must stay up 10s or restart doesn't count  |

### Adjusting for Different Server Sizes

**For 512MB-1GB RAM:**

```javascript
max_memory_restart: "300M",
node_args: "--max-old-space-size=384",
```

**For 2GB-4GB RAM:**

```javascript
max_memory_restart: "800M",
node_args: "--max-old-space-size=1024",
```

**For 4GB+ RAM (can use cluster):**

```javascript
max_memory_restart: "1500M",
node_args: "--max-old-space-size=2048",
instances: 2, // Multiple instances
exec_mode: "cluster",
```

### Manual Usage

```bash
# Start with ecosystem
cd /root/mypal/frontend/internal-admin/current
pm2 start ecosystem.config.js

# Restart
pm2 restart internal-admin

# View configuration
pm2 show internal-admin

# Reload (zero-downtime)
pm2 reload ecosystem.config.js

# Delete and restart fresh
pm2 delete internal-admin
pm2 start ecosystem.config.js
pm2 save
```

---

## Memory & Resource Management

### Why This Matters

**Typical Internal Admin Server:**

- RAM: ~1.9GB physical
- Swap: 3GB (critical!)
- Multiple projects running
- Limited disk space

**Without optimization:**

- Apps crash randomly (OOM)
- Server becomes unresponsive
- Deployments fail
- Disk fills up quickly

**With optimization:**

- Predictable memory usage
- Apps restart gracefully if needed
- Stable multi-project hosting
- Efficient disk usage

### Swap Configuration (CRITICAL)

If you have <2GB RAM or run multiple apps, **you MUST configure swap**:

```bash
# Check current swap
free -h

# If swap is 0B or <2GB, create 3GB swap:
sudo fallocate -l 3G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize swappiness (lower = less swap usage)
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# Verify
free -h
```

**Swap Size Recommendations:**

- 1GB RAM + 1 project = 2GB swap
- 1GB RAM + 2-3 projects = 3-4GB swap
- 2GB RAM + multiple projects = 2-3GB swap

### Memory Monitoring

```bash
# Real-time PM2 monitoring
pm2 monit

# System memory
free -h

# Check swap usage
free -h | grep Swap

# See which processes use most RAM
ps aux --sort=-%mem | head -10

# Monitor over time
watch -n 5 'free -h'
```

### Warning Signs

**Your server needs attention if:**

- Apps restart every few minutes
- `pm2 status` shows high restart counts
- Server becomes slow/unresponsive
- `dmesg` shows "Out of memory" errors

**Check for issues:**

```bash
# Check for OOM kills
dmesg | grep -i "out of memory"
dmesg | grep -i "killed process"

# Check PM2 logs
pm2 logs internal-admin --lines 100

# Check memory trends
free -h
```

### Multiple Projects Strategy

If running multiple apps on one server:

**1. Stagger memory limits:**

```
Project 1 (main): 500MB limit
Project 2: 400MB limit
Project 3: 300MB limit
Total: ~1.2GB (leaving headroom)
```

**2. Use different ports:**

```
internal-admin: 4000
project-2: 4001
project-3: 4002
```

**3. Monitor total usage:**

```bash
pm2 status
# Check sum of memory column

free -h
# Ensure you're not using >90% RAM
```

---

## Backup Strategy Changes

### What Changed?

**Old Strategy (space-intensive):**

- Keep 3 deploy directories = ~1.5GB (with node_modules)
- Keep 5 backup directories = ~2.5GB (with node_modules)
- **Total: ~4GB**

**New Strategy (space-efficient):**

- Keep 2 deploy directories = ~700MB (with node_modules)
- Keep 2 backup directories = ~150MB (**without** node_modules)
- **Total: ~850MB**
- **Savings: 75% less disk space!**

### Why Exclude node_modules?

**Reasoning:**

1. **Size:** node_modules is 200-500MB per backup
2. **Reproducible:** Can be reinstalled from package.json + lock file
3. **Space:** Critical for servers with 20-50GB disk
4. **Fast cleanup:** Old backups don't hog disk space

**What's Backed Up:**

- ✅ Built application (.next/standalone)
- ✅ Environment files (.env.production)
- ✅ PM2 configuration (ecosystem.config.js)
- ✅ Static files (public/)
- ✅ Server code (server.js)
- ❌ node_modules (reinstalled during rollback if needed)
- ❌ logs (transient data)

### Rollback Impact

**Rollback with node_modules (old):**

- Time: ~30 seconds
- Process: Copy backup → restart

**Rollback without node_modules (new):**

- Time: ~2 minutes
- Process: Copy backup → reinstall dependencies → restart

**Trade-off:**

- 90 seconds slower rollback
- 75% less disk space used
- Still much faster than full redeploy (~10 minutes)

### Rollback Process

The workflow now:

1. Restores backup directory
2. Checks if `node_modules` exists
3. If missing, runs `pnpm install --no-frozen-lockfile --prod`
4. Starts with PM2 ecosystem config

```bash
# Automatic via GitHub Actions
# (See Rollback Procedure in main deployment guide)

# Manual rollback
cd /root/mypal/frontend/internal-admin
cp -r backup_TIMESTAMP current
cd current

# Reinstall if needed
if [ ! -d "node_modules" ]; then
  pnpm install --no-frozen-lockfile --prod
fi

pm2 delete internal-admin
pm2 start ecosystem.config.js
pm2 save
```

### Adjusting Retention

**Current:** 2 deploys + 2 backups = ~850MB

**To keep more:**

Edit `.github/workflows/deploy.yml` around line 288:

```bash
# Change from +3 to +4 for 3 deploys
ls -dt deploy_* 2>/dev/null | tail -n +4 | xargs -r rm -rf

# Change from +3 to +4 for 3 backups
ls -dt backup_* 2>/dev/null | tail -n +4 | xargs -r rm -rf
```

**Storage Math:**

- 2 each = ~850MB
- 3 each = ~1.2GB
- 4 each = ~1.6GB
- 5 each = ~2GB

**Recommendation by disk size:**

- <20GB disk: Keep 2 of each ✅ (current)
- 20-50GB disk: Keep 3 of each
- 50GB+ disk: Keep 4-5 of each

---

## Troubleshooting PM2 Issues

### Issue: PM2 Process Keeps Restarting

**Symptoms:**

```bash
pm2 status
# Shows: status: errored, restarts: 15+
```

**Common Causes & Solutions:**

**1. Memory limit too low**

```bash
pm2 logs internal-admin --lines 50
# Look for: "Exceeded maximum memory limit"
```

Solution: Increase `max_memory_restart` to 600M

**2. Port already in use (EADDRINUSE)**

```bash
pm2 logs internal-admin --lines 30
# Look for: "EADDRINUSE: address already in use 0.0.0.0:4000"
```

Solution:

```bash
# Find what's using port
sudo lsof -i :4000

# Kill it or change port in ecosystem.config.js
```

**3. Missing environment variables**

```bash
cd /root/mypal/frontend/internal-admin/current
cat .env.production
# Verify all required variables present
```

Solution: Redeploy or manually fix `.env.production`

### Issue: Environment Variables Not Loading

**Symptoms:**

- App starts but features broken
- Database connection errors
- 500 errors on API calls

**Diagnosis:**

```bash
pm2 show internal-admin
# Check "Environment" section

cd /root/mypal/frontend/internal-admin/current
ls -la .env*
cat .env.production
```

**Solutions:**

1. Update GitHub secret `INTERNAL_ADMIN_ENV` and redeploy
2. Manually fix on server (temporary):
   ```bash
   nano .env.production
   pm2 restart internal-admin
   ```

### Issue: High Memory Usage / OOM

**Symptoms:**

```bash
pm2 monit
# Memory usage keeps growing past 500MB

dmesg | grep -i "out of memory"
# Shows OOM killer messages
```

**Solutions:**

1. **Lower memory limit:**

   ```javascript
   max_memory_restart: "400M",
   node_args: "--max-old-space-size=384",
   ```

2. **Add/increase swap:**

   ```bash
   free -h
   # If swap is low, create/increase it
   ```

3. **Check for memory leaks:**

   ```bash
   # Monitor over time
   watch -n 5 'pm2 status | grep internal-admin'

   # Check app logs
   pm2 logs internal-admin --lines 100
   ```

### Issue: 502 Bad Gateway After Successful Deployment

**Symptoms:**

- GitHub Actions shows ✅ success
- Site shows "502 Bad Gateway"

**Diagnosis:**

```bash
ssh root@YOUR_SERVER_IP

pm2 status
# Is internal-admin running or errored?

curl http://localhost:4000
# Does app respond locally?

sudo tail -f /var/log/nginx/internal-admin.error.log
# What does Nginx say?
```

**Solutions:**

1. **PM2 not running:**

   ```bash
   cd /root/mypal/frontend/internal-admin/current
   pm2 delete internal-admin
   pm2 start ecosystem.config.js
   pm2 save
   ```

2. **Wrong port:**

   ```bash
   # Check Nginx config
   sudo nano /etc/nginx/sites-available/internal-admin
   # Verify: proxy_pass http://localhost:4000;

   # Should match ecosystem.config.js PORT
   ```

3. **Firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 4000/tcp
   ```

### Issue: Rollback Takes 2+ Minutes

**Symptoms:**

- Rollback used to be instant
- Now takes 2-3 minutes

**Explanation:**
This is **NORMAL and EXPECTED** with the new lightweight backup strategy.

**Why:**

- Backups no longer include `node_modules` (saves 300MB per backup)
- During rollback, dependencies are reinstalled (~90 seconds)
- Still much faster than full redeploy (~10 minutes)

**Trade-off:**

- Slower rollback: +90 seconds
- Disk space saved: -75%
- Still acceptable for emergency rollback

**If you need instant rollback:**
You'd need to keep `node_modules` in backups, which uses significantly more disk space. Not recommended for servers with <50GB disk.

---

## Recommendations

### For New Deployments

1. **✅ Use ecosystem.config.js** (automatic in new deployments)
2. **✅ Configure swap** if RAM <2GB or running multiple apps
3. **✅ Keep 2 deploys + 2 backups** (default, good for most servers)
4. **✅ Monitor memory** with `pm2 monit` regularly
5. **✅ Set up PM2 startup** on reboot (done automatically)

### For Existing Deployments

If you deployed before this ecosystem config was added:

```bash
ssh root@YOUR_SERVER_IP
cd /root/mypal/frontend/internal-admin/current

# Check if ecosystem.config.js exists
ls -la ecosystem.config.js

# If not, create it or redeploy
# Redeploy is easier (just push to main branch)

# Or manually create it with the config above
nano ecosystem.config.js
# Paste the configuration

# Switch to ecosystem
pm2 delete internal-admin
pm2 start ecosystem.config.js
pm2 save
```

### Regular Maintenance

**Daily:**

- Check `pm2 status` for restart counts
- Monitor disk space: `df -h`

**Weekly:**

- Review logs: `pm2 logs internal-admin --lines 500`
- Check memory trends: `free -h`
- Verify backups exist

**Monthly:**

- Clean old deployments if >3: `ls -lt deploy_*`
- Update Node.js and PM2
- Review and optimize memory limits

### Monitoring Thresholds

| Metric       | Warning | Critical | Action                                    |
| ------------ | ------- | -------- | ----------------------------------------- |
| RAM Usage    | >75%    | >90%     | Add swap or reduce limits                 |
| Swap Usage   | >50%    | >80%     | Upgrade RAM or optimize apps              |
| Disk Usage   | >75%    | >90%     | Clean old deploys/backups                 |
| PM2 Restarts | >5/hour | >20/hour | Check logs, adjust memory                 |
| Backup Age   | >7 days | >14 days | Trigger deployment to create fresh backup |

---

## Quick Commands Reference

```bash
# PM2 Operations
pm2 start ecosystem.config.js       # Start with config
pm2 restart internal-admin          # Restart app
pm2 logs internal-admin --lines 50  # View logs
pm2 monit                           # Real-time monitoring
pm2 status                          # Status overview
pm2 save                            # Save current config
pm2 delete internal-admin           # Remove process

# Memory Checks
free -h                             # Memory & swap
pm2 monit                           # PM2 memory usage
ps aux --sort=-%mem | head -10      # Top memory processes
watch -n 5 'free -h'                # Monitor over time

# Disk Space
df -h                               # Disk usage
du -sh /root/mypal/frontend/internal-admin/*  # Deployment sizes

# Deployment Checks
cd /root/mypal/frontend/internal-admin
ls -lt deploy_*                     # List deployments
ls -lt backup_*                     # List backups
cat .last_successful_backup         # Last backup location

# System Health
dmesg | grep -i "out of memory"     # Check for OOM kills
sudo systemctl status nginx          # Nginx status
curl http://localhost:4000/api/health  # App health check
```

---

## Support

For issues:

1. Check this document first
2. Review main [`deployment_readme.md`](./deployment_readme.md)
3. Check PM2 logs: `pm2 logs internal-admin`
4. Check system logs: `dmesg` and `free -h`
5. See [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md) for full troubleshooting guide

**Emergency Rollback:**

```bash
# Via GitHub Actions
GitHub → Actions → Run workflow → Select "rollback"

# Manual
cd /root/mypal/frontend/internal-admin
cp -r $(cat .last_successful_backup) current
cd current
pnpm install --no-frozen-lockfile --prod
pm2 delete internal-admin
pm2 start ecosystem.config.js
pm2 save
```

---

**Last Updated:** November 9, 2024
**Applies To:** deploy.yml and nextjs_deploy_workflow_standard.yml
