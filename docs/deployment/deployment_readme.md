# Next.js Production Deployment Guide

## Zero-Downtime CI/CD with GitHub Actions, PM2 & Standalone Mode

> **🆕 NEW: PM2 Ecosystem Configuration & Optimization Guide**
>
> This project now uses PM2 ecosystem configuration for better resource management on low-RAM servers.
> **See [`ECOSYSTEM_AND_OPTIMIZATIONS.md`](./ECOSYSTEM_AND_OPTIMIZATIONS.md)** for:
>
> - PM2 ecosystem config explained
> - Memory & resource management strategies
> - Lightweight backup strategy (75% disk space savings)
> - Troubleshooting PM2-specific issues
> - Recommendations for low-RAM environments

This guide provides step-by-step instructions for setting up automated deployments of your Next.js application to a DigitalOcean server with zero-downtime, rollback capability, and production-grade reliability.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Prerequisites](#prerequisites)
5. [Server Setup](#server-setup)
6. [Next.js Configuration](#nextjs-configuration)
7. [GitHub Repository Setup](#github-repository-setup)
8. [Domain & SSL Configuration](#domain--ssl-configuration)
9. [GitHub Actions Workflow](#github-actions-workflow)
10. [PM2 Ecosystem Configuration](#pm2-ecosystem-configuration) ⭐ **NEW**
11. [Usage & Deployment](#usage--deployment)
12. [Rollback Procedure](#rollback-procedure)
13. [Monitoring & Logs](#monitoring--logs)
14. [Troubleshooting](#troubleshooting)
15. [Memory & Resource Management](#memory--resource-management) ⭐ **NEW**
16. [Backup Strategy](#backup-strategy) ⭐ **NEW**
17. [Advanced Configuration](#advanced-configuration)

---

## 🎯 Overview

This deployment system uses:

- **GitHub Actions** for CI/CD automation
- **Next.js Standalone Mode** for optimized production builds (50-100MB vs 500MB+)
- **PM2** for process management and zero-downtime deployments
- **Nginx** as reverse proxy for domain/SSL management
- **SSH** for secure file transfers and remote execution

### Deployment Flow

```
Push to GitHub (main branch)
    ↓
GitHub Actions Triggered
    ↓
Build & Test (CI)
    ↓
Create Standalone Package (~50-100MB)
    ↓
Upload to Server via SSH
    ↓
Extract & Configure on Server
    ↓
Start New Instance (PM2)
    ↓
Health Check (30 retries)
    ↓
Switch Traffic (Zero-Downtime)
    ↓
Save Backup for Rollback
    ↓
✅ Deployment Complete
```

---

## ✨ Features

### GitHub Actions Workflow Capabilities

✅ **Automated Deployment**

- Triggers on push to `main` branch
- Manual deployment via workflow dispatch

✅ **Auto-Merge Feature**

- Merge `development` → `main` with commit message `[merge-to-main]`
- Runs smoke tests before merging

✅ **Quality Checks**

- Runs linting (if configured)
- Runs tests (if configured)
- Verifies build output

✅ **Zero-Downtime Deployment**

- New instance starts alongside old one
- Health checks before switching traffic
- Automatic rollback on failure

✅ **Rollback Support**

- One-click rollback via workflow dispatch
- Maintains last 5 backup versions
- Preserves environment configuration

✅ **Resource Management**

- Automatic disk space checks
- Cleanup of old deployments (keeps last 3)
- Cleanup of old backups (keeps last 5)

✅ **Notifications**

- Optional Slack notifications
- Success/failure alerts
- Deployment details included

---

## 🏗️ Architecture

### Server Directory Structure

```
/root/mypal/frontend/internal-admin/
├── current/                    # Symlink to active deployment
├── deploy_20241109_143022/    # Timestamped deployments
├── deploy_20241109_120045/
├── deploy_20241108_183012/
├── backup_20241109_143022/    # Backup before each deployment
├── backup_20241109_120045/
├── backup_20241108_183012/
├── backup_20241107_154530/
├── backup_20241106_092145/
└── .last_successful_backup    # Points to last backup directory
```

### Network Flow

```
Internet
    ↓
Domain (admin.yourdomain.com)
    ↓
Nginx (Port 80/443) → SSL Termination
    ↓
PM2 Process (Next.js Standalone)
    ↓
Port 4000 (localhost)
```

---

## 📦 Prerequisites

### Required Software & Accounts

- ✅ **DigitalOcean Droplet** (or any VPS)

  - Ubuntu 20.04+ recommended
  - Minimum 2GB RAM, 50GB disk
  - Root or sudo access

- ✅ **GitHub Repository**

  - Your Next.js project
  - Admin access to configure secrets

- ✅ **Domain Name**

  - DNS access to create A records
  - Subdomain configured (e.g., `admin.yourdomain.com`)

- ✅ **Local Machine**
  - SSH key pair for server access
  - Git installed

### Optional

- Slack workspace (for notifications)
- Let's Encrypt account (automatic with Certbot)

---

## 🖥️ Server Setup

### Step 1: Connect to Your Server

```bash
# SSH into your DigitalOcean droplet
ssh root@YOUR_SERVER_IP

# Example:
ssh root@159.65.123.456
```

### Step 2: Update System Packages

```bash
# Update package list
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

### Step 3: Install Node.js 20

```bash
# Add NodeSource repository for Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
```

### Step 4: Configure Swap Space (Important for Low-Memory Servers)

Swap space prevents out-of-memory errors during builds and deployments.

```bash
# Check if swap exists
sudo swapon --show
free -h

# If no swap exists, create one (recommended: 2x RAM or 4GB minimum)
# For 2GB droplet, create 4GB swap:

# Create swap file
sudo fallocate -l 4G /swapfile

# Or use dd if fallocate doesn't work:
# sudo dd if=/dev/zero of=/swapfile bs=1M count=4096

# Set correct permissions
sudo chmod 600 /swapfile

# Make it a swap file
sudo mkswap /swapfile

# Enable swap
sudo swapon /swapfile

# Verify swap is active
sudo swapon --show
free -h

# Make swap permanent (survive reboots)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize swap settings for better performance
sudo sysctl vm.swappiness=10
sudo sysctl vm.vfs_cache_pressure=50

# Make swap optimizations permanent
sudo bash -c 'cat >> /etc/sysctl.conf << EOF
vm.swappiness=10
vm.vfs_cache_pressure=50
EOF'

# Verify settings
cat /proc/sys/vm/swappiness
cat /proc/sys/vm/vfs_cache_pressure
```

**Swap Size Recommendations:**

- 1GB RAM → 2-4GB swap
- 2GB RAM → 4GB swap
- 4GB RAM → 4GB swap
- 8GB+ RAM → 2-4GB swap

### Step 5: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version

# Setup PM2 to start on system boot
pm2 startup systemd

# The above command will output a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
# Copy and run that command

# Example output:
# [PM2] Init System found: systemd
# [PM2] To setup the Startup Script, copy/paste the following command:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# Run the command it gives you, then:
pm2 save
```

### Step 5: Create Deployment Directory

```bash
# Create directory structure
mkdir -p /root/mypal/frontend/internal-admin

# Set proper permissions (if using non-root user)
# sudo chown -R deployer:deployer /root/mypal/frontend/internal-admin

# Navigate to directory
cd /root/mypal/frontend/internal-admin

# Verify
pwd
# Output: /root/mypal/frontend/internal-admin
```

### Step 6: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
# Should show "active (running)"
```

### Step 7: Configure Nginx for Your Application

```bash
# Create Nginx configuration file
sudo nano /etc/nginx/sites-available/internal-admin
```

**Paste this configuration** (replace `admin.yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name admin.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/internal-admin.access.log;
    error_log /var/log/nginx/internal-admin.error.log;

    # Client body size (for file uploads)
    client_max_body_size 100M;

    location / {
        # Proxy to Next.js application
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets optimization (Next.js serves these)
    location /_next/static {
        proxy_pass http://localhost:4000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

**Save and exit** (Ctrl + X, then Y, then Enter)

```bash
# Enable the site by creating a symbolic link
sudo ln -s /etc/nginx/sites-available/internal-admin /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t
# Should show: "syntax is ok" and "test is successful"

# Reload Nginx to apply changes
sudo systemctl reload nginx
```

### Step 8: Configure Firewall

```bash
# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 9: Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install SSL certificate
# Replace admin.yourdomain.com with your actual domain
sudo certbot --nginx -d admin.yourdomain.com

# Follow the prompts:
# - Enter your email address
# - Agree to Terms of Service (Y)
# - Choose whether to redirect HTTP to HTTPS (recommended: 2)

# Certbot will automatically:
# 1. Obtain certificate from Let's Encrypt
# 2. Modify Nginx configuration
# 3. Set up auto-renewal

# Verify auto-renewal is configured
sudo systemctl status certbot.timer

# Test renewal process (dry run)
sudo certbot renew --dry-run
```

### Step 10: Verify Server Setup

```bash
# Check all services are running
sudo systemctl status nginx
sudo systemctl status certbot.timer
pm2 status

# Check Node.js version
node --version

# Check PM2 version
pm2 --version

# Verify directory exists
ls -la /root/mypal/frontend/internal-admin
```

✅ **Server setup complete!** Your server is now ready to receive deployments.

---

## ⚙️ Next.js Configuration

### Step 1: Enable Standalone Output Mode

This is **critical** for optimized deployments. Edit your Next.js config file:

**For `next.config.js`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // ← Add this line!

  // Your existing configuration
  reactStrictMode: true,
  images: {
    domains: ["yourdomain.com"],
  },
  // ... other config
};

module.exports = nextConfig;
```

**For `next.config.mjs`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // ← Add this line!

  // Your existing configuration
  reactStrictMode: true,
  // ... other config
};

export default nextConfig;
```

**For `next.config.ts`:**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // ← Add this line!

  // Your existing configuration
  reactStrictMode: true,
  // ... other config
};

export default nextConfig;
```

### Step 2: Create Health Check Endpoint (Optional but Recommended)

The workflow checks `/api/health` to verify deployment success. Create this endpoint:

**For Pages Router:**

Create `pages/api/health.js`:

```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
}
```

**For App Router:**

Create `app/api/health/route.ts`:

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
}
```

### Step 3: Prepare Environment Variables

Create a `.env.example` file to document required variables:

```bash
# .env.example
NODE_ENV=production
PORT=4000

# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
API_SECRET_KEY=your-secret-key

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
NEXTAUTH_URL=https://admin.yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret

# Add all your required environment variables here
```

Create your actual `.env.production` file (do NOT commit this):

```bash
# .env.production (DO NOT COMMIT)
NODE_ENV=production
PORT=4000

# Your actual production values
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
API_SECRET_KEY=actual-secret-key-here
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_URL=https://admin.yourdomain.com
NEXTAUTH_SECRET=actual-nextauth-secret-here
```

### Step 4: Update `.gitignore`

Ensure sensitive files are not committed:

```bash
# .gitignore

# Environment variables
.env
.env.local
.env.production
.env.development.local
.env.test.local
.env.production.local

# Next.js
.next/
out/

# Dependencies
node_modules/

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
```

### Step 5: Test Standalone Build Locally

```bash
# Install dependencies
npm install

# Build in standalone mode
npm run build

# Check if standalone directory was created
ls -la .next/standalone

# You should see:
# - server.js
# - node_modules/ (minimal runtime deps)
# - package.json

# Test the standalone build
cd .next/standalone
node server.js

# Visit http://localhost:3000
# Press Ctrl+C to stop
```

✅ **Next.js configuration complete!**

---

## � PM2 Ecosystem Configuration

### Overview

This project now uses a **PM2 ecosystem configuration file** (`ecosystem.config.js`) for better process management, especially on servers with limited resources.

### What is ecosystem.config.js?

The ecosystem config provides:

- ✅ **Memory limits** - Auto-restart if app uses too much RAM
- ✅ **Environment variables** - PORT, HOSTNAME configured properly
- ✅ **Logging configuration** - Structured logs with timestamps
- ✅ **Auto-restart settings** - Prevents infinite restart loops
- ✅ **Graceful shutdown** - Proper cleanup on restarts

### Current Configuration

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
      node_args: "--max-old-space-size=512", // 512MB heap limit
      // Logging
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Auto-restart limits
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
```

### Why This Matters

**Before ecosystem.config.js:**

```bash
pm2 start npm --name internal-admin -- start -- -p 4000
# Problem: Environment variables might not load correctly
# Problem: No memory limits (can crash server)
# Problem: No structured logging
```

**After ecosystem.config.js:**

```bash
pm2 start ecosystem.config.js
# ✅ All settings configured in one place
# ✅ Memory limits prevent OOM crashes
# ✅ Environment variables always correct
# ✅ Proper logging with timestamps
```

### Deployment Integration

The ecosystem.config.js file is **automatically included** in the deployment package and used by both workflows:

- `deploy.yml` (standalone/pnpm)
- `nextjs_deploy_workflow_standard.yml` (npm)

**No manual configuration needed!** The workflow handles everything.

### Manual Usage (if needed)

```bash
# Start with ecosystem config
cd /root/mypal/frontend/internal-admin/current
pm2 start ecosystem.config.js

# Restart
pm2 restart internal-admin

# View config
pm2 show internal-admin

# Update and reload
pm2 reload ecosystem.config.js
```

### Adjusting Memory Limits

If your server has different RAM:

**For 512MB-1GB RAM servers:**

```javascript
max_memory_restart: "300M",
node_args: "--max-old-space-size=384",
```

**For 2GB-4GB RAM servers:**

```javascript
max_memory_restart: "800M",
node_args: "--max-old-space-size=1024",
```

**For 4GB+ RAM servers:**

```javascript
max_memory_restart: "1500M",
node_args: "--max-old-space-size=2048",
instances: 2, // Can use cluster mode
exec_mode: "cluster",
```

### Common Issues with Ecosystem Config

#### Issue: App keeps restarting

**Check logs:**

```bash
pm2 logs internal-admin --lines 100
```

**Possible causes:**

1. Memory limit too low (increase `max_memory_restart`)
2. Port already in use (check with `lsof -i :4000`)
3. Missing environment variables (check `.env.production`)

**Solution:**

```bash
# Increase memory limit
# Edit ecosystem.config.js on server
max_memory_restart: "600M"

# Restart
pm2 delete internal-admin
pm2 start ecosystem.config.js
```

#### Issue: Environment variables not loading

**Verify:**

```bash
cd /root/mypal/frontend/internal-admin/current
pm2 show internal-admin
# Check "Environment" section
```

**Solution:**
The ecosystem.config.js has PORT and HOSTNAME hardcoded. Other variables come from `.env.production` which is created during deployment from the GitHub secret `INTERNAL_ADMIN_ENV`.

---

## �🔑 GitHub Repository Setup

### Step 1: Generate SSH Key for Deployments

On your **local machine**:

```bash
# Generate a new SSH key specifically for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# This creates two files:
# - ~/.ssh/github_deploy (private key) → for GitHub Secrets
# - ~/.ssh/github_deploy.pub (public key) → for server
```

### Step 2: Add Public Key to Server

```bash
# Copy the public key to your server
ssh-copy-id -i ~/.ssh/github_deploy.pub root@YOUR_SERVER_IP

# Or manually:
cat ~/.ssh/github_deploy.pub
# Copy the output

# Then on your server:
ssh root@YOUR_SERVER_IP
mkdir -p ~/.ssh
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

### Step 3: Test SSH Connection

```bash
# Test the connection with the new key
ssh -i ~/.ssh/github_deploy root@YOUR_SERVER_IP

# If successful, you should connect without password
# Type 'exit' to disconnect
```

### Step 4: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add the following secrets:

#### 🔐 **Secret 1: DEPLOY_KEY**

```bash
# On your local machine, copy the PRIVATE key
cat ~/.ssh/github_deploy

# Copy EVERYTHING including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... content ...
# -----END OPENSSH PRIVATE KEY-----
```

- **Name:** `DEPLOY_KEY`
- **Value:** Paste the entire private key

#### 🔐 **Secret 2: SERVER_HOST**

- **Name:** `SERVER_HOST`
- **Value:** Your server IP address (e.g., `159.65.123.456`)

#### 🔐 **Secret 3: INTERNAL_ADMIN_ENV**

```bash
# Copy your .env.production file contents
cat .env.production
```

- **Name:** `INTERNAL_ADMIN_ENV`
- **Value:** Paste the entire contents of your `.env.production` file

Example:

```
NODE_ENV=production
PORT=4000
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_URL=https://admin.yourdomain.com
NEXTAUTH_SECRET=your-secret-here
```

#### 🔐 **Secret 4: PAT_TOKEN** (Optional - for auto-merge)

If you want the auto-merge feature (`development` → `main`):

1. Go to GitHub → **Settings** (your profile) → **Developer settings**
2. Click **Personal access tokens** → **Tokens (classic)**
3. Click **Generate new token (classic)**
4. Give it a name: `GitHub Actions Auto-Merge`
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
6. Click **Generate token**
7. Copy the token (you won't see it again!)

- **Name:** `PAT_TOKEN`
- **Value:** Paste your personal access token

#### 🔐 **Secret 5: SLACK_WEBHOOK_URL** (Optional - for notifications)

If you want Slack notifications:

1. Go to your Slack workspace
2. Create a new app or use existing: https://api.slack.com/apps
3. Enable **Incoming Webhooks**
4. Add webhook to a channel
5. Copy the webhook URL

- **Name:** `SLACK_WEBHOOK_URL`
- **Value:** Paste your Slack webhook URL (e.g., `https://hooks.slack.com/services/...`)

### Step 5: Verify Secrets

After adding all secrets, you should see:

```
✓ DEPLOY_KEY
✓ SERVER_HOST
✓ INTERNAL_ADMIN_ENV
✓ PAT_TOKEN (optional)
✓ SLACK_WEBHOOK_URL (optional)
```

✅ **GitHub secrets configured!**

---

## 🚀 GitHub Actions Workflow

### Step 1: Create Workflow File

In your Next.js repository:

```bash
# Create workflows directory
mkdir -p .github/workflows

# Create the workflow file
touch .github/workflows/deploy.yml
```

### Step 2: Add Workflow Configuration

Copy the workflow content from the artifact above into `.github/workflows/deploy.yml`

### Step 3: Customize Workflow Variables

Edit the `env` section at the top of the workflow:

```yaml
env:
  NODE_VERSION: "20"
  DEPLOY_USER: "root" # Change if using non-root user
  DEPLOY_PATH: "/root/mypal/frontend/internal-admin" # Your server path
  APP_PORT: "4000" # Port your app runs on
  PM2_APP_NAME: "internal-admin" # PM2 process name
  HEALTH_ENDPOINT: "/api/health" # Your health check endpoint
  DOMAIN: "admin.yourdomain.com" # Your actual domain
```

### Step 4: Commit and Push

```bash
# Add the workflow file
git add .github/workflows/deploy.yml

# Also commit your Next.js config changes
git add next.config.js  # or next.config.mjs

# Commit
git commit -m "Add GitHub Actions deployment workflow"

# Push to main branch
git push origin main
```

### Step 5: Verify Workflow Execution

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see your workflow running
4. Click on the running workflow to see details

✅ **Workflow configured and running!**

---

## 🌐 Domain & SSL Configuration

### Step 1: Configure DNS

In your domain registrar or DNS provider (e.g., Cloudflare, NameCheap, GoDaddy):

1. Create an **A Record**:

   - **Type:** A
   - **Name:** `admin` (or your subdomain)
   - **Value:** Your server IP (e.g., `159.65.123.456`)
   - **TTL:** 300 (or automatic)

2. Wait for DNS propagation (5-30 minutes)

3. Test DNS resolution:

```bash
# On your local machine
nslookup admin.yourdomain.com

# Or
dig admin.yourdomain.com

# Should show your server IP
```

### Step 2: Verify SSL Certificate

```bash
# On your server
sudo certbot certificates

# Should show your certificate details
```

### Step 3: Test HTTPS

```bash
# Visit your domain
https://admin.yourdomain.com

# Should show:
# - Valid SSL certificate (green padlock)
# - Your Next.js application
```

✅ **Domain and SSL configured!**

---

## 📝 Usage & Deployment

### Automatic Deployment (Push to Main)

The easiest way to deploy:

```bash
# Make your changes
git add .
git commit -m "feat: add new feature"

# Push to main branch
git push origin main

# GitHub Actions will automatically:
# 1. Build your application
# 2. Run tests
# 3. Deploy to server
# 4. Send notification (if configured)
```

### Manual Deployment (Workflow Dispatch)

Deploy without pushing code:

1. Go to GitHub → **Actions** tab
2. Click **Internal Admin CI/CD with Rollback**
3. Click **Run workflow** (top right)
4. Select:
   - **Branch:** `main`
   - **Action:** `deploy`
5. Click **Run workflow**

### Auto-Merge Feature (Development → Main)

To automatically merge and deploy from development branch:

```bash
# On development branch
git add .
git commit -m "feat: new feature [merge-to-main]"
git push origin development

# The [merge-to-main] tag triggers:
# 1. Checkout main
# 2. Merge development
# 3. Run smoke tests
# 4. Push to main (triggers deployment)
```

### Deployment Process Overview

```
Workflow Triggered
    ↓
[1] Checkout Code (10s)
    ↓
[2] Setup Node.js & Cache (30s)
    ↓
[3] Install Dependencies (1-2 min)
    ↓
[4] Run Linting (10-30s)
    ↓
[5] Run Tests (30s-2 min)
    ↓
[6] Build Standalone (2-5 min)
    ↓
[7] Create Package (~50-100MB) (30s)
    ↓
[8] Upload to Server (30s-1 min)
    ↓
[9] Server Deployment (2-3 min)
    ├─ Extract package
    ├─ Setup environment
    ├─ Start new instance
    ├─ Health check (max 60s)
    ├─ Switch traffic
    └─ Save backup
    ↓
✅ Deployment Complete!
Total Time: 8-15 minutes
```

---

## ⏪ Rollback Procedure

### When to Rollback

Rollback if:

- New deployment has bugs
- Performance issues
- Breaking changes
- Need to revert quickly

### How to Rollback

#### Method 1: GitHub Actions (Recommended)

1. Go to GitHub → **Actions**
2. Click **Internal Admin CI/CD with Rollback**
3. Click **Run workflow**
4. Select:
   - **Branch:** `main`
   - **Action:** `rollback`
5. Click **Run workflow**

The rollback process:

```
Read .last_successful_backup
    ↓
Stop current PM2 process
    ↓
Restore backup directory
    ↓
Restart PM2 with backup
    ↓
✅ Rollback Complete (1-2 minutes)
```

#### Method 2: Manual Server Rollback

If GitHub Actions is unavailable:

```bash
# SSH to server
ssh root@YOUR_SERVER_IP

# Navigate to deployment directory
cd /root/mypal/frontend/internal-admin

# Check last backup
cat .last_successful_backup
# Output: /root/mypal/frontend/internal-admin/backup_20241109_120045

# List available backups
ls -lt backup_*

# Manually restore a backup
BACKUP_DIR="/root/mypal/frontend/internal-admin/backup_20241109_120045"

# Stop current app
pm2 stop internal-admin

# Restore backup
rm -rf current
cp -r $BACKUP_DIR current

# Restart app
cd current
pm2 restart internal-admin

# Or if process doesn't exist
pm2 start server.js --name internal-admin -- -p 4000

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

### Rollback Limitations

- Can only rollback to the last successful deployment
- Environment variables from backup are used
- Database migrations are NOT automatically reverted
- External service integrations may need manual adjustment

---

## 📊 Monitoring & Logs

### PM2 Process Monitoring

```bash
# SSH to server
ssh root@YOUR_SERVER_IP

# Check all PM2 processes
pm2 status

# View logs (real-time)
pm2 logs internal-admin

# View last 100 lines of logs
pm2 logs internal-admin --lines 100

# View only error logs
pm2 logs internal-admin --err

# View logs without streaming
pm2 logs internal-admin --nostream

# Monitor CPU and memory
pm2 monit
```

### Application Logs

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/internal-admin.access.log

# Nginx error logs
sudo tail -f /var/log/nginx/internal-admin.error.log

# System logs
sudo journalctl -u nginx -f
```

### PM2 Web Dashboard (Optional)

```bash
# Install PM2 web interface
pm2 install pm2-server-monit

# Access at: http://YOUR_SERVER_IP:9615
```

### Health Check Endpoint

```bash
# Check health from server
curl http://localhost:4000/api/health

# Check health from outside
curl https://admin.yourdomain.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-11-09T14:30:22.123Z",
  "uptime": 12345.67,
  "environment": "production"
}
```

---

## � Memory & Resource Management

### Overview

This section is **critical** if you're running on a server with limited resources (1-2GB RAM) or hosting multiple applications.

### Current Server Profile: Internal Admin

Based on the typical DigitalOcean setup:

- **RAM:** ~1.9GB physical
- **Swap:** 3GB (recommended)
- **Multiple Projects:** Yes (requires careful memory management)
- **PM2 Config:** Optimized for low RAM (500MB limit)

### Memory Optimization Strategy

#### 1. Swap Space (REQUIRED for <2GB RAM)

If you haven't configured swap yet:

```bash
# Check current swap
free -h

# If swap is 0B or less than 2GB, create 3GB swap:
sudo fallocate -l 3G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for less aggressive swapping (better performance)
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# Verify
free -h
```

**Why This Matters:**

- Without swap: Server crashes when RAM is full
- With swap: Apps run slower but stay alive
- 3GB swap = enough headroom for multiple Next.js apps

#### 2. PM2 Memory Limits

The ecosystem.config.js is configured for low RAM:

```javascript
max_memory_restart: "500M",  // App restarts at 500MB
node_args: "--max-old-space-size=512",  // Heap limited to 512MB
instances: 1,  // Single instance (not cluster)
```

**What This Does:**

- Prevents one app from using all RAM
- Auto-restarts before causing OOM (Out of Memory) errors
- Keeps memory footprint predictable

**Monitoring Memory:**

```bash
# Real-time monitoring
pm2 monit

# Memory usage summary
free -h

# Check if swap is being used
free -h | grep Swap

# See which processes use most memory
ps aux --sort=-%mem | head -10

# PM2 specific memory usage
pm2 status
```

#### 3. Multiple Projects on Same Server

If you're running multiple projects (common scenario):

**Best Practices:**

1. **Stagger memory limits:**

   - Project 1: 500MB limit
   - Project 2: 400MB limit
   - Project 3: 300MB limit
   - Total: ~1.2GB (leaving 700MB for system + swap)

2. **Use different ports:**

   - internal-admin: 4000
   - project-2: 4001
   - project-3: 4002

3. **Monitor total memory:**

```bash
# Check total PM2 memory usage
pm2 status

# Check system memory
free -h

# Set up alerts if memory > 80%
watch -n 5 'free -h'
```

#### 4. Warning Signs of Memory Issues

**Symptoms:**

- Apps restart frequently (every few minutes)
- Server becomes unresponsive
- `dmesg` shows "Out of memory: Kill process"
- Deployments fail randomly

**Check for OOM (Out of Memory) kills:**

```bash
# Check system logs for OOM killer
dmesg | grep -i "out of memory"
dmesg | grep -i "killed process"

# Check which process was killed
dmesg | grep -i "kill"

# PM2 restart history
pm2 status
# Look for "restart" column with high numbers
```

**Solutions:**

1. **Increase swap** (quick fix)
2. **Reduce memory limits** in ecosystem.config.js
3. **Stop unnecessary services:**

```bash
# List all running services
systemctl list-units --type=service --state=running

# Stop unnecessary ones (example)
sudo systemctl stop apache2  # If you're using nginx
sudo systemctl disable apache2
```

4. **Upgrade server** (if budget allows)

#### 5. Resource Monitoring Commands

```bash
# One-time checks
free -h              # Memory usage
df -h                # Disk usage
pm2 status          # PM2 processes
pm2 monit           # Real-time PM2 monitoring

# Continuous monitoring
watch -n 2 free -h                    # Update every 2 seconds
htop                                  # Interactive process viewer
pm2 logs internal-admin --lines 50   # Recent logs

# Check specific metrics
# Swap usage percentage
free | grep Swap | awk '{print ($3/$2) * 100 "%"}'

# Memory usage percentage
free | grep Mem | awk '{print ($3/$2) * 100 "%"}'
```

### Recommended Thresholds

| Metric       | Warning | Critical | Action                      |
| ------------ | ------- | -------- | --------------------------- |
| RAM Usage    | >75%    | >90%     | Add swap or reduce limits   |
| Swap Usage   | >50%    | >80%     | Upgrade RAM                 |
| Disk Usage   | >75%    | >90%     | Clean old deploys           |
| PM2 Restarts | >5/hour | >20/hour | Check logs, increase memory |

---

## 📦 Backup Strategy

### Overview

The deployment workflow now uses a **lightweight backup strategy** to save disk space on servers with limited storage.

### What Changed

**Previous Strategy (space-intensive):**

```
Keep 3 deploy directories       # ~1.5GB (includes node_modules)
Keep 5 backup directories       # ~2.5GB (includes node_modules)
Total: ~4GB
```

**New Strategy (space-efficient):**

```
Keep 2 deploy directories       # ~700MB (includes node_modules)
Keep 2 backup directories       # ~150MB (excludes node_modules)
Total: ~850MB
Savings: ~75% less disk space!
```

### Why Exclude node_modules from Backups?

**Rationale:**

1. **Size:** node_modules is 200-500MB per backup
2. **Reproducible:** Can be reinstalled from package.json + lock file
3. **Space:** Servers with 20-50GB disk need every MB
4. **Speed:** Faster backups, faster cleanup

**What's Backed Up:**

- ✅ Built application (.next/standalone)
- ✅ Environment files (.env.production)
- ✅ PM2 configuration (ecosystem.config.js)
- ✅ Static files (public/)
- ✅ Server code (server.js)
- ❌ node_modules (reinstalled during rollback if needed)
- ❌ logs (transient data)

### How Rollback Works with Lightweight Backups

**During Rollback:**

```bash
# 1. Restore backup directory
cp -r backup_TIMESTAMP current

# 2. Check if node_modules exists
if [ ! -d "node_modules" ]; then
  # 3. Reinstall dependencies (takes 1-2 minutes)
  pnpm install --no-frozen-lockfile --prod
fi

# 4. Restart with PM2
pm2 start ecosystem.config.js
```

**Rollback Time:**

- With node_modules (old): ~30 seconds
- Without node_modules (new): ~2 minutes (includes reinstall)
- Trade-off: 90 seconds slower rollback, but 75% disk space saved

### Backup Directory Structure

```
/root/mypal/frontend/internal-admin/
├── current -> deploy_20251109_070247/
├── deploy_20251109_070247/          # Active deployment
│   ├── server.js
│   ├── .env.production
│   ├── ecosystem.config.js
│   ├── node_modules/                # ← HAS node_modules
│   ├── .next/
│   ├── public/
│   └── logs/
├── deploy_20251108_143022/          # Previous deployment
│   └── ... (same structure)
├── backup_20251109_070247/          # Lightweight backup
│   ├── server.js
│   ├── .env.production
│   ├── ecosystem.config.js
│   ├── .next/                       # ← NO node_modules
│   └── public/
└── backup_20251108_143022/          # Previous backup
    └── ... (same structure)
```

### Manual Backup Management

**Check backup sizes:**

```bash
cd /root/mypal/frontend/internal-admin
du -sh deploy_*
du -sh backup_*

# Example output:
# 350M    deploy_20251109_070247
# 340M    deploy_20251108_143022
# 75M     backup_20251109_070247
# 80M     backup_20251108_143022
```

**Manual cleanup (if needed):**

```bash
# Remove old deployments (keep only 2 newest)
ls -dt deploy_* | tail -n +3 | xargs rm -rf

# Remove old backups (keep only 2 newest)
ls -dt backup_* | tail -n +3 | xargs rm -rf

# Check disk space freed
df -h
```

**Emergency cleanup (disk full):**

```bash
# Keep ONLY current deployment
cd /root/mypal/frontend/internal-admin

# Remove ALL old deploys except current
find . -maxdepth 1 -type d -name "deploy_*" ! -name "$(readlink -f current | xargs basename)" -exec rm -rf {} \;

# Remove ALL backups
rm -rf backup_*

# Clean PM2 logs
pm2 flush

# Clean system logs
sudo journalctl --vacuum-time=3d
sudo journalctl --vacuum-size=100M

# Clear package manager caches
pnpm store prune
npm cache clean --force
```

### Adjusting Retention Policy

If you want to keep more or fewer backups, edit the workflow files:

**In `.github/workflows/deploy.yml` (around line 288):**

```bash
# Keep only the 2 most recent deploy directories
ls -dt deploy_* 2>/dev/null | tail -n +3 | xargs -r rm -rf

# Change +3 to +4 to keep 3 deploys
# Change +3 to +5 to keep 4 deploys
```

**Storage Math:**

- 2 deploys + 2 backups = ~850MB
- 3 deploys + 3 backups = ~1.2GB
- 4 deploys + 4 backups = ~1.6GB
- 5 deploys + 5 backups = ~2GB

**Recommendation:**

- <20GB disk: Keep 2 of each
- 20-50GB disk: Keep 3 of each
- 50GB+ disk: Keep 4-5 of each

### Backup Verification

After deployment, verify backups exist:

```bash
ssh root@YOUR_SERVER_IP
cd /root/mypal/frontend/internal-admin

# List all backups with sizes
ls -lth backup_*

# Check last successful backup pointer
cat .last_successful_backup

# Verify backup integrity (spot check)
BACKUP=$(cat .last_successful_backup)
ls -la $BACKUP
# Should see: server.js, .env.production, ecosystem.config.js, .next/, public/
```

---

## �🔧 Troubleshooting

### Issue 1: Deployment Fails at Health Check

**Symptoms:**

```
❌ Health check failed after 30 attempts
Rolling back...
```

**Solutions:**

1. **Check if app is actually running:**

```bash
ssh root@YOUR_SERVER_IP
pm2 status
pm2 logs internal-admin --lines 50
```

2. **Check if port is correct:**

```bash
# Check what's running on port 4000
sudo lsof -i :4000

# Or
sudo netstat -tulpn | grep 4000
```

3. **Verify environment variables:**

```bash
cd /root/mypal/frontend/internal-admin/current
cat .env.production
# Make sure PORT=4000 is set
```

4. **Test health endpoint manually:**

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/
```

5. **Check Next.js logs:**

```bash
pm2 logs internal-admin --lines 200
```

### Issue 2: "standalone directory not found"

**Error:**

```
❌ Standalone build failed - .next/standalone directory not found
```

**Solution:**

Verify `next.config.js` has `output: 'standalone'`:

```javascript
// next.config.js
const nextConfig = {
  output: "standalone", // ← Make sure this is present
};
```

Commit and push again:

```bash
git add next.config.js
git commit -m "fix: enable standalone output"
git push origin main
```

### Issue 3: SSH Connection Refused

**Error:**

```
ssh: connect to host SERVER_IP port 22: Connection refused
```

**Solutions:**

1. **Check firewall allows SSH:**

```bash
# On server
sudo ufw status
sudo ufw allow 22/tcp
```

2. **Verify SSH service is running:**

```bash
sudo systemctl status ssh
sudo systemctl start ssh
```

3. **Check GitHub secret SERVER_HOST:**
   - Make sure it's your actual server IP
   - No spaces or extra characters

### Issue 4: Permission Denied

**Error:**

```
Permission denied (publickey)
```

**Solutions:**

1. **Verify SSH key is added to server:**

```bash
# On server
cat ~/.ssh/authorized_keys
# Should contain your public key
```

2. **Check GitHub secret DEPLOY_KEY:**

   - Must be the PRIVATE key
   - Include -----BEGIN and -----END lines
   - No extra spaces or line breaks

3. **Test SSH key locally:**

```bash
ssh -i ~/.ssh/github_deploy root@YOUR_SERVER_IP
```

### Issue 5: Port Already in Use

**Error:**

```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solutions:**

1. **Find process using the port:**

```bash
sudo lsof -i :4000
# Or
sudo netstat -tulpn | grep 4000
```

2. **Kill the process:**

```bash
# If it's a PM2 process
pm2 delete internal-admin

# If it's another process
sudo kill -9 PID_NUMBER
```

3. **Use a different port:**
   - Update workflow env: `APP_PORT: '4001'`
   - Update `.env.production`: `PORT=4001`
   - Update Nginx config: `proxy_pass http://localhost:4001;`

### Issue 6: Disk Space Full

**Error:**

```
❌ Insufficient disk space (0GB available)
```

**Solutions:**

1. **Check disk usage:**

```bash
df -h
du -sh /root/mypal/frontend/internal-admin/*
```

2. **Manual cleanup:**

```bash
cd /root/mypal/frontend/internal-admin

# Remove old deployments (keep last 2)
ls -dt deploy_* | tail -n +3 | xargs rm -rf

# Remove old backups (keep last 3)
ls -dt backup_* | tail -n +4 | xargs rm -rf

# Clean PM2 logs
pm2 flush

# Clean system logs
sudo journalctl --vacuum-time=7d
```

3. **Increase droplet size:**
   - Go to DigitalOcean dashboard
   - Resize your droplet to add more disk space

### Issue 7: Environment Variables Not Loading

**Symptoms:**

- App starts but features don't work
- Database connection errors
- API calls failing

**Solutions:**

1. **Check environment file exists:**

```bash
ssh root@YOUR_SERVER_IP
cd /root/mypal/frontend/internal-admin/current
ls -la .env*
cat .env.production
```

2. **Verify GitHub secret INTERNAL_ADMIN_ENV:**

   - Go to GitHub → Settings → Secrets
   - Check INTERNAL_ADMIN_ENV has all required variables
   - No syntax errors (KEY=VALUE format)

3. **Restart PM2 process:**

```bash
pm2 restart internal-admin
pm2 logs internal-admin
```

4. **Check if variables are loaded:**

```bash
# In your app, log environment variables (temporarily)
# pages/api/debug.js
export default function handler(req, res) {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    // Don't log sensitive values!
  })
}
```

### Issue 8: Nginx 502 Bad Gateway

**Error:**

```
502 Bad Gateway
nginx/1.18.0
```

**Solutions:**

1. **Check if Next.js app is running:**

```bash
pm2 status
pm2 logs internal-admin
```

2. **Check if app is listening on correct port:**

```bash
curl http://localhost:4000
```

3. **Check Nginx configuration:**

```bash
sudo nginx -t
sudo systemctl restart nginx
```

4. **Check Nginx error logs:**

```bash
sudo tail -f /var/log/nginx/internal-admin.error.log
```

### Issue 9: SSL Certificate Issues

**Error:**

```
NET::ERR_CERT_AUTHORITY_INVALID
```

**Solutions:**

1. **Check certificate status:**

```bash
sudo certbot certificates
```

2. **Renew certificate:**

```bash
sudo certbot renew --force-renewal -d admin.yourdomain.com
```

3. **Check Nginx SSL configuration:**

```bash
sudo cat /etc/nginx/sites-available/internal-admin
# Should have ssl_certificate lines
```

4. **Restart Nginx:**

```bash
sudo systemctl restart nginx
```

### Issue 10: GitHub Actions Workflow Not Triggering

**Solutions:**

1. **Check workflow file syntax:**

```bash
# Install act (GitHub Actions local runner)
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Test workflow locally
act -l
```

2. **Verify workflow file location:**

```bash
# Must be in:
.github/workflows/deploy.yml
```

3. **Check branch name:**

```yaml
# In workflow file
on:
  push:
    branches:
      - main # ← Make sure this matches your default branch
```

4. **Check Actions tab in GitHub:**
   - Go to repository → Actions
   - Look for error messages
   - Check if Actions are enabled

---

## 🚀 Advanced Configuration

### Custom Deployment Script

Add a `deploy.sh` script to your repository for pre/post-deployment tasks:

```bash
#!/bin/bash
# deploy.sh - Custom deployment script

set -e

echo "🔧 Running pre-deployment tasks..."

# Example: Database migrations
# npm run migrate

# Example: Clear cache
# npm run cache:clear

# Example: Generate static files
# npm run generate:sitemap

echo "✅ Pre-deployment tasks complete"
```

Update workflow to use it:

```yaml
- name: Run custom deployment script
  run: |
    chmod +x deploy.sh
    ./deploy.sh
```

### Multiple Environments

Deploy to staging and production:

**Create separate workflow files:**

`.github/workflows/deploy-staging.yml`

```yaml
name: Deploy to Staging
on:
  push:
    branches:
      - development
env:
  DEPLOY_PATH: "/root/mypal/frontend/internal-admin-staging"
  APP_PORT: "4001"
  PM2_APP_NAME: "internal-admin-staging"
  DOMAIN: "staging-admin.yourdomain.com"
```

`.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Production
on:
  push:
    branches:
      - main
env:
  DEPLOY_PATH: "/root/mypal/frontend/internal-admin"
  APP_PORT: "4000"
  PM2_APP_NAME: "internal-admin"
  DOMAIN: "admin.yourdomain.com"
```

### Database Migrations

Add migration step to workflow:

```yaml
- name: Run database migrations
  run: |
    ssh -i ~/.ssh/deploy_key \
      ${{ env.DEPLOY_USER }}@${{ secrets.SERVER_HOST }} << 'ENDSSH'
    cd /root/mypal/frontend/internal-admin/current
    npm run migrate
    ENDSSH
```

### Performance Monitoring

Add performance monitoring with PM2:

```bash
# On server
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Load Balancing (Multiple Instances)

Run multiple instances of your app:

```bash
# Start 4 instances (cluster mode)
pm2 start server.js \
  --name internal-admin \
  --instances 4 \
  --exec-mode cluster \
  -- -p 4000
```

Update Nginx for load balancing:

```nginx
upstream nextjs_backend {
    least_conn;
    server localhost:4000;
    server localhost:4001;
    server localhost:4002;
    server localhost:4003;
}

server {
    # ... other config
    location / {
        proxy_pass http://nextjs_backend;
        # ... other proxy settings
    }
}
```

### Automated Backups

Create a backup script:

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/root/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump -U postgres your_database > "$BACKUP_DIR/db_$DATE.sql"

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql"
```

Add to crontab:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /root/scripts/backup-database.sh
```

### Slack Notification Customization

Customize Slack messages in workflow:

```yaml
- name: Send detailed Slack notification
  if: success()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d '{
        "blocks": [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": "✅ Deployment Successful",
              "emoji": true
            }
          },
          {
            "type": "section",
            "fields": [
              {"type": "mrkdwn", "text": "*Project:*\nInternal Admin"},
              {"type": "mrkdwn", "text": "*Environment:*\nProduction"},
              {"type": "mrkdwn", "text": "*Branch:*\n`${{ github.ref_name }}`"},
              {"type": "mrkdwn", "text": "*Commit:*\n`${{ github.sha }}`"},
              {"type": "mrkdwn", "text": "*Author:*\n${{ github.actor }}"},
              {"type": "mrkdwn", "text": "*Time:*\n$(date)"}
            ]
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Commit Message:*\n${{ github.event.head_commit.message }}"
            }
          },
          {
            "type": "actions",
            "elements": [
              {
                "type": "button",
                "text": {"type": "plain_text", "text": "View Site"},
                "url": "https://${{ env.DOMAIN }}"
              },
              {
                "type": "button",
                "text": {"type": "plain_text", "text": "View Logs"},
                "url": "https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
              }
            ]
          }
        ]
      }'
```

### Security Hardening

**1. Enable Fail2Ban (SSH protection):**

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local

# Find [sshd] section and ensure:
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600

# Restart Fail2Ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status sshd
```

**2. Setup automated security updates:**

```bash
# Install unattended upgrades
sudo apt install -y unattended-upgrades

# Enable automatic security updates
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

**3. Add rate limiting to Nginx:**

```nginx
# In /etc/nginx/sites-available/internal-admin
# Add before server block:
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    # ... other config

    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://localhost:4000;
        # ... other proxy settings
    }
}
```

---

## 📋 Deployment Checklist

Use this checklist for your first deployment:

### Pre-Deployment

- [ ] Server is set up and accessible via SSH
- [ ] Node.js 20 is installed
- [ ] PM2 is installed and configured
- [ ] Nginx is installed and configured
- [ ] Domain DNS is pointing to server
- [ ] SSL certificate is installed
- [ ] Firewall rules are configured
- [ ] `next.config.js` has `output: 'standalone'`
- [ ] Health check endpoint exists
- [ ] `.env.production` file is prepared
- [ ] GitHub secrets are configured:
  - [ ] DEPLOY_KEY
  - [ ] SERVER_HOST
  - [ ] INTERNAL_ADMIN_ENV
  - [ ] PAT_TOKEN (optional)
  - [ ] SLACK_WEBHOOK_URL (optional)
- [ ] Workflow file is in `.github/workflows/deploy.yml`
- [ ] Workflow environment variables are customized

### First Deployment

- [ ] Commit and push to main branch
- [ ] Monitor GitHub Actions workflow
- [ ] Check workflow completes successfully
- [ ] Verify app is accessible at domain
- [ ] Test health check endpoint
- [ ] Check PM2 process is running
- [ ] Review application logs
- [ ] Test main application features
- [ ] Verify SSL certificate is valid

### Post-Deployment

- [ ] Document any issues encountered
- [ ] Set up monitoring alerts
- [ ] Schedule regular backups
- [ ] Plan rollback procedure
- [ ] Train team on deployment process

---

## 🎓 Best Practices

### 1. Branch Strategy

```
main (production)
  ↑
  └── development (staging)
       ↑
       └── feature/new-feature (local development)
```

### 2. Commit Messages

Use conventional commits:

```bash
feat: add user authentication
fix: resolve login redirect issue
docs: update deployment guide
refactor: optimize database queries
test: add unit tests for auth
chore: update dependencies
```

### 3. Environment Variables

- Never commit `.env` files
- Use different values for staging/production
- Rotate secrets regularly
- Document all required variables in `.env.example`

### 4. Testing Before Deployment

```bash
# Local testing
npm run build
npm run start

# Test in development branch first
git checkout development
# Make changes
git push origin development
# Monitor staging deployment
# If successful, merge to main
```

### 5. Monitoring

- Check PM2 status daily
- Review logs for errors
- Monitor disk space usage
- Set up alerts for downtime
- Track deployment frequency

### 6. Documentation

- Keep this README updated
- Document custom configurations
- Maintain runbook for incidents
- Record deployment times and issues

---

## 📚 Additional Resources

### Official Documentation

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [GitHub Actions](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/docs/)

### Useful Commands Reference

```bash
# PM2 Commands
pm2 start server.js --name app
pm2 stop app
pm2 restart app
pm2 delete app
pm2 logs app
pm2 monit
pm2 save
pm2 resurrect

# Nginx Commands
sudo nginx -t
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo systemctl status nginx

# SSL/Certbot Commands
sudo certbot --nginx
sudo certbot renew
sudo certbot certificates
sudo certbot delete --cert-name example.com

# System Commands
df -h                    # Disk usage
free -m                  # Memory usage
top                      # Process monitor
htop                     # Better process monitor
sudo systemctl status    # Service status
journalctl -xe          # System logs
```

---

## 🆘 Support & Troubleshooting

### Getting Help

1. **Check workflow logs first:**

   - GitHub → Actions → Click failed workflow
   - Expand each step to see errors

2. **Check server logs:**

   ```bash
   pm2 logs internal-admin --lines 200
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Common issues:**
   - Review the [Troubleshooting](#troubleshooting) section
   - Search GitHub Issues
   - Check Stack Overflow

### Debug Mode

Enable debug mode in workflow:

```yaml
- name: Deploy with debug
  run: |
    ssh -vvv -i ~/.ssh/deploy_key root@SERVER_IP
  # -vvv enables verbose SSH output
```

Enable PM2 debug mode:

```bash
pm2 start server.js --name internal-admin --log-date-format="YYYY-MM-DD HH:mm:ss"
```

---

## 🎉 Conclusion

You now have a production-grade deployment system with:

✅ Automated CI/CD pipeline
✅ Zero-downtime deployments
✅ One-click rollback capability
✅ Optimized standalone builds
✅ SSL/HTTPS support
✅ Process management with PM2
✅ Automated cleanups and backups
✅ Health checks and monitoring
✅ Slack notifications

### Next Steps

1. Complete your first deployment
2. Test the rollback feature
3. Set up monitoring and alerts
4. Document any custom configurations
5. Train your team on the deployment process

### Maintenance Schedule

- **Daily:** Check PM2 status and logs
- **Weekly:** Review disk space and cleanup
- **Monthly:** Update dependencies and security patches
- **Quarterly:** Review and optimize deployment process

---

## 📄 License & Credits

This deployment guide and workflow are provided as-is for use in your projects.

**Credits:**

- Next.js Team for standalone build feature
- PM2 Team for process management
- GitHub Actions for CI/CD platform
- Nginx Team for reverse proxy
- Let's Encrypt for free SSL certificates

---

## 📞 Quick Reference

### Emergency Contacts

```bash
# Quick rollback
GitHub Actions → Run workflow → Select "rollback"

# Manual emergency stop
ssh root@SERVER_IP
pm2 stop internal-admin

# Quick restart
pm2 restart internal-admin

# Check if site is up
curl https://admin.yourdomain.com/api/health
```

### Important Paths

```
Server:
├── App: /root/mypal/frontend/internal-admin/current
├── Nginx Config: /etc/nginx/sites-available/internal-admin
├── SSL Certs: /etc/letsencrypt/live/admin.yourdomain.com
└── Logs: /var/log/nginx/

GitHub:
├── Workflow: .github/workflows/deploy.yml
├── Secrets: Settings → Secrets and variables → Actions
└── Actions: Actions tab

Local:
├── SSH Key: ~/.ssh/github_deploy
├── Config: next.config.js
└── Env: .env.production (don't commit!)
```

---

**Last Updated:** November 2024
**Version:** 1.0.0
**Deployment Mode:** Standalone (Optimized)

For questions or issues, refer to the troubleshooting section or check the GitHub Actions logs.
