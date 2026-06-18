# Complete Digital Ocean Droplet Deployment Guide

A comprehensive guide for deploying Node.js applications (Next.js, NestJS, etc.) to Digital Ocean droplets, including SSH setup, troubleshooting, and auto-deployment.

## Table of Contents

1. [SSH Key Setup & Troubleshooting](#ssh-key-setup--troubleshooting)
2. [Initial Server Setup](#initial-server-setup)
3. [Deploying Your First Application](#deploying-your-first-application)
4. [Adding New Services/Subdomains](#adding-new-servicessubdomains)
5. [GitHub Auto-Deployment Setup](#github-auto-deployment-setup)
6. [Common Troubleshooting](#common-troubleshooting)
7. [Production Optimizations](#production-optimizations)

---

## SSH Key Setup & Troubleshooting

### 1. SSH Key Permission Issues

If you get "Permission denied" or "invalid format" errors:

```bash
# Fix common SSH key issues
chmod 600 ./your-private-key

# Fix corrupted key format (remove % at end and add newline)
sed 's/-----END OPENSSH PRIVATE KEY-----%.*/-----END OPENSSH PRIVATE KEY-----/' ./your-private-key > ./fixed-key
echo "" >> ./fixed-key
chmod 600 ./fixed-key

# Test if key is valid
ssh-keygen -y -f ./fixed-key
```

### 2. Convert Different Key Formats

```bash
# Convert PuTTY (.ppk) to OpenSSH
ssh-keygen -i -f ./your-key.ppk > ./openssh-key
chmod 600 ./openssh-key

# Fix line endings (Windows to Unix)
tr -d '\r' < ./your-key > ./unix-key
chmod 600 ./unix-key
```

### 3. Generate New SSH Key for GitHub

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Start SSH agent and add key
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key (macOS)
pbcopy < ~/.ssh/id_ed25519.pub

# Copy public key (Linux)
xclip -sel clip < ~/.ssh/id_ed25519.pub

# Or display to copy manually
cat ~/.ssh/id_ed25519.pub
```

---

## Initial Server Setup

### 1. Connect to Your Droplet

```bash
# Basic connection
ssh -i ./your-private-key root@YOUR_DROPLET_IP

# With verbose output for debugging
ssh -v -i ./your-private-key root@YOUR_DROPLET_IP

# Try different users if root doesn't work
ssh -i ./your-private-key ubuntu@YOUR_DROPLET_IP
```

### 2. Update System and Install Dependencies

```bash
# Update system packages
apt update && apt upgrade -y

# Install Node.js (LTS version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs

# Install essential tools
apt install -y nginx git curl wget htop net-tools

# Install PM2 for process management
npm install -g pm2

# Install SSL certificate manager
apt install -y certbot python3-certbot-nginx
```

### 3. Configure Firewall

```bash
# Configure UFW firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Check firewall status
ufw status
```

---

## Deploying Your First Application

### 1. Create Directory Structure

```bash
# Create main project directory
mkdir -p ~/mypal
cd ~/mypal

# For multiple services
mkdir backend frontend
```

### 2. Upload Your Project

**Method A: SCP Upload**

```bash
# From local machine - upload entire project
scp -i ./your-private-key -r /path/to/your/project root@YOUR_DROPLET_IP:~/mypal/frontend/

# or

rsync -avz -e "ssh -i ./server-private-key-fixed" --exclude=node_modules --exclude=.git --exclude=.next . root@159.65.90.235:~/mypal/frontend/business-frontend

# Or create tar for faster upload
tar -czf project.tar.gz --exclude=node_modules --exclude=.git --exclude=.next .
scp -i ./your-private-key project.tar.gz root@YOUR_DROPLET_IP:~/mypal/

# Extract on server
cd ~/mypal/frontend/
tar -xzf ../project.tar.gz
rm ../project.tar.gz
```

**Method B: Git Clone (Recommended)**

```bash
# On server
cd ~/mypal/
git clone git@github.com:username/your-project.git frontend
```

### 3. Install Dependencies and Build

```bash
cd ~/mypal/frontend/

# Install dependencies
npm install

# Create environment file
nano .env.local
```

**Environment file template:**

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
PORT=3000
# Add other environment variables as needed
```

```bash
# Build the project
npm run build

# Test build locally
npm start &
sleep 5
curl http://localhost:3000
kill %1
```

### 4. Configure PM2

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**PM2 Configuration:**

```javascript
module.exports = {
  apps: [
    {
      name: "your-app-name",
      script: "npm",
      args: "start",
      cwd: "/root/mypal/frontend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
```

```bash
# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 startup script
pm2 startup
# Follow the command it provides (usually with sudo)
```

### 5. Configure Nginx

```bash
# Create nginx configuration
nano /etc/nginx/sites-available/your-domain
```

**Basic Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000; # Take note of the port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Optimize Next.js static files
    location /_next/static/ {
        proxy_pass http://localhost:3000; # Take note of the port
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Handle Next.js images
    location /_next/image {
        proxy_pass http://localhost:3000; # Take note of the port
    }

    listen 80;
}
```

```bash
# Enable site and restart nginx
ln -s /etc/nginx/sites-available/your-domain /etc/nginx/sites-enabled/
# Test nginx configuration
nginx -t
# Reload nginx
systemctl restart nginx
```

### 6. Set Up SSL Certificate

```bash
# Get SSL certificate with Let's Encrypt
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
certbot renew --dry-run
```

---

## Adding New Services/Subdomains

### 1. Create New Service Directory

```bash
# Example: Adding a business subdomain
cd ~/mypal/
mkdir business-frontend
```

### 2. Deploy New Service

```bash
# Upload/clone your new project
cd ~/mypal/business-frontend/
# ... upload or git clone your project

# Install and build
npm install
npm run build
```

### 3. Configure PM2 for New Service

```bash
# Create separate ecosystem config
nano ~/mypal/business-frontend/ecosystem.config.js
```

**Multi-service PM2 Configuration:**

```javascript
module.exports = {
  apps: [
    {
      name: "business-frontend",
      script: "npm",
      args: "start",
      cwd: "/root/mypal/business-frontend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3002, // Different port for each service
      },
    },
  ],
};
```

```bash
# Start new service
pm2 start ecosystem.config.js
pm2 save
```

### 4. Configure Nginx for Subdomain

```bash
# Create new nginx config for subdomain
nano /etc/nginx/sites-available/business-subdomain
```

**Subdomain Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name business.yourdomain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable subdomain and get SSL
ln -s /etc/nginx/sites-available/business-subdomain /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
certbot --nginx -d business.yourdomain.com
```

### 5. Update DNS Records

Add DNS A record in your domain registrar:

- **Name**: `business` (for business.yourdomain.com)
- **Type**: `A`
- **Value**: Your droplet's IP address
- **TTL**: `300` or default

---

## GitHub Auto-Deployment Setup

### 1. Create GitHub Actions Workflow

In your local project, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Digital Ocean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application with memory limit
        run: NODE_OPTIONS='--max-old-space-size=6144' npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.PRIVATE_KEY }}
          script: |
            cd ~/mypal/frontend

            # Set memory limit for server operations
            export NODE_OPTIONS="--max-old-space-size=4096"

            # Backup environment file
            cp .env.local .env.local.backup 2>/dev/null || true

            # Pull latest changes
            git pull origin main

            # Install dependencies
            npm ci

            # Update environment
            echo "NODE_ENV=production" > .env.local
            echo "NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL }}" >> .env.local

            # Build with memory limit
            NODE_OPTIONS="--max-old-space-size=4096" npm run build

            # Restart with zero downtime
            pm2 reload your-app-name || pm2 start ecosystem.config.js
            pm2 save

            # Health check
            sleep 10
            if pm2 list | grep -q "your-app-name.*online"; then
              echo "Deployment successful!"
            else
              echo "Deployment failed!"
              exit 1
            fi
```

### 2. Configure GitHub Secrets

In your GitHub repository: **Settings → Secrets and variables → Actions**

Add these secrets:

- **HOST**: Your droplet's IP address
- **USERNAME**: `root` (or your server username)
- **PRIVATE_KEY**: Your complete SSH private key content
- **NEXT_PUBLIC_API_URL**: Your API URL
- Any other environment variables

### 3. Test Auto-Deployment

```bash
# Commit and push the workflow
git add .github/workflows/deploy.yml
git commit -m "Add auto-deployment"
git push origin main

# Check GitHub Actions tab for deployment status
```

---

## Common Troubleshooting

### 1. Port Conflicts

```bash
# Check what's using a port
lsof -i :3000
netstat -tlnp | grep :3000

# Kill process on port
kill -9 $(lsof -t -i:3000)

# Change your app's port
export PORT=3001
# or update ecosystem.config.js
```

### 2. PM2 Issues

```bash
# Check PM2 status
pm2 list
pm2 status

# View logs
pm2 logs your-app-name
pm2 logs --lines 100

# Restart application
pm2 restart your-app-name

# Completely remove and restart
pm2 delete your-app-name
pm2 start ecosystem.config.js
```

### 3. Nginx Issues

```bash
# Test nginx configuration
nginx -t

# Check nginx status
systemctl status nginx

# View nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Restart nginx
systemctl restart nginx
```

### 4. SSL Certificate Issues

```bash
# Check certificate status
certbot certificates

# Renew certificates
certbot renew

# Fix certificate issues
certbot --nginx -d yourdomain.com --force-renewal
```

### 5. Build Failures & Memory Issues

**JavaScript Heap Out of Memory Error:**

```bash
# Quick fix - increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# For larger projects, increase further
export NODE_OPTIONS="--max-old-space-size=6144"
npm run build

# Clear build cache and try again
rm -rf .next
npm run build
```

**Permanent Memory Solutions:**

Update `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "your-app-name",
      script: "npm",
      args: "start",
      cwd: "/root/mypal/frontend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NODE_OPTIONS: "--max-old-space-size=4096", // Add this
      },
    },
  ],
};
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build",
    "build:memory": "NODE_OPTIONS='--max-old-space-size=6144' next build"
  }
}
```

Create optimized `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    craCompat: true,
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  output: "standalone",
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: {
            minChunks: 1,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: -10,
            chunks: "all",
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

**Alternative: Local Build & Upload:**

```bash
# Build locally (on machine with more RAM)
npm run build
tar -czf build-files.tar.gz .next public package.json package-lock.json

# Upload to server
scp -i ./your-private-key build-files.tar.gz root@YOUR_DROPLET_IP:~/mypal/frontend/

# Extract on server
cd ~/mypal/frontend/
tar -xzf build-files.tar.gz
npm install --production
pm2 restart your-app-name
```

**Temporary Swap Memory Solution:**

```bash
# Create swap file for extra memory during builds
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Verify swap is active
free -h

# Build with swap active
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Optional: Remove swap after build
# sudo swapoff /swapfile
# sudo rm /swapfile
```

**Other Build Issues:**

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check disk space
df -h

# Check memory usage during build
htop
```

### 6. DNS Issues

```bash
# Check DNS propagation
nslookup yourdomain.com
dig yourdomain.com

# Test local resolution
curl -H "Host: yourdomain.com" http://YOUR_DROPLET_IP
```

---

## Production Optimizations

## Memory & Performance Considerations

### Recommended Droplet Sizes

- **Basic apps**: 1GB RAM minimum
- **Next.js apps**: 2GB RAM recommended
- **Multiple services**: 4GB+ RAM recommended
- **Heavy builds**: Consider 8GB for build process

### Memory Optimization Tips

```bash
# Check current memory usage
free -h
htop

# Monitor during builds
watch -n 1 'free -h'

# Check Node.js process memory
ps aux | grep node

# Monitor PM2 memory usage
pm2 monit
```

### 2. Security Hardening

```bash
# Disable root login (after creating another user)
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# Change default SSH port
sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
systemctl restart sshd
ufw allow 2222
```

### 3. Backup Strategy

```bash
# Create backup script
nano /root/backup.sh
```

**Backup Script:**

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application code
tar -czf $BACKUP_DIR/mypal_$DATE.tar.gz ~/mypal

# Backup nginx configs
tar -czf $BACKUP_DIR/nginx_$DATE.tar.gz /etc/nginx/sites-available /etc/nginx/sites-enabled

# Backup PM2 configs
pm2 save
tar -czf $BACKUP_DIR/pm2_$DATE.tar.gz ~/.pm2

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable and add to cron
chmod +x /root/backup.sh
crontab -e
# Add: 0 2 * * * /root/backup.sh >> /var/log/backup.log 2>&1
```

### 4. Monitoring Setup

```bash
# Install monitoring tools
npm install -g pm2-server-monit

# Set up basic monitoring
pm2 install pm2-server-monit
```

---

## Quick Reference Commands

### Essential Server Commands

```bash
# System info
uname -a
df -h
free -h
ps aux | grep node

# Service management
systemctl status nginx
systemctl restart nginx
pm2 list
pm2 logs
pm2 restart all

# Network
netstat -tlnp | grep LISTEN
curl -I http://localhost:3000
curl -I https://yourdomain.com

# Logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
pm2 logs --lines 50
```

### Directory Structure Example

```
/root/mypal/
├── backend/                    # NestJS API (port 3000)
│   ├── dist/
│   ├── ecosystem.config.js
│   └── .env.local
├── frontend/                   # Main website (port 3001)
│   ├── .next/
│   ├── ecosystem.config.js
│   └── .env.local
└── business-frontend/          # Business app (port 3002)
    ├── .next/
    ├── ecosystem.config.js
    └── .env.local
```

### Port Mapping Example

- **3000**: Backend API → `api.yourdomain.com`
- **3001**: Main frontend → `yourdomain.com`
- **3002**: Business app → `business.yourdomain.com`
- **80/443**: Nginx proxy

---

## Conclusion

This guide covers the complete lifecycle of deploying and managing Node.js applications on Digital Ocean droplets. Keep this document updated as you add new services or encounter new issues.

**Remember to:**

- Always backup before making changes
- Test configurations before applying
- Monitor logs during deployments
- Keep your system updated
- Use version control for all configurations

For additional help, consult:

- [Digital Ocean Documentation](https://docs.digitalocean.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
