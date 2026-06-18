# Complete App Versioning System

This system provides automatic versioning for your Next.js PWA with intelligent caching strategies.

## 🚀 Quick Setup

### 1. Install Dependencies
Make sure you have these in your `package.json`:
```json
{
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

### 2. File Structure
```
your-app/
├── next.config.js          # Updated config with versioning
├── public/
│   └── sw.js              # Versioned service worker
├── hooks/
│   └── useAppVersion.ts   # Version management hook
├── components/
│   ├── AppUpdateNotification.tsx
│   └── InstallPrompt.tsx  # Your existing component
├── scripts/
│   └── generate-version.js
├── app/
│   └── layout.tsx         # Integration example
└── .env.example           # Environment configuration
```

### 3. Environment Setup
```bash
# Copy environment file
cp .env.example .env.local

# Make scripts executable
chmod +x scripts/generate-version.js
```

## 📝 How It Works

### Version Generation
- **Development**: `{git-hash}-dev-{timestamp}` (e.g., `a1b2c3d-dev-20240826-1430`)
- **Staging**: `{git-hash}-staging-{timestamp}` (e.g., `a1b2c3d-staging-20240826-1430`)
- **Production**: `{git-hash}` (e.g., `a1b2c3d4`)

### Cache Strategies
- **HTML Pages**: Network-first (always fresh content)
- **Static Assets**: Cache-first (images, icons)
- **JS/CSS**: Stale-while-revalidate (fast loading + background updates)
- **API Requests**: Network-first with 5-minute cache fallback

### Automatic Updates
- Service worker detects version changes
- Shows user-friendly update notification
- One-click app refresh with cache clearing

## 🛠 Commands

### Development
```bash
# Start development server
npm run dev

# Start with Turbopack
npm run dev:turbo
```

### Building
```bash
# Development build
npm run build

# Production build
npm run build:prod

# Check current version
npm run version:check
```

### Deployment
```bash
# Staging deployment
npm run deploy:staging

# Production deployment  
npm run deploy:production
```

### Maintenance
```bash
# Validate service worker
npm run sw:validate

# Clear all caches
npm run cache:clear
```

## 🎯 Usage Examples

### In Your Components
```tsx
import { useAppVersion } from '@/hooks/useAppVersion';

function MyComponent() {
  const { 
    current, 
    isUpdateAvailable, 
    refreshApp, 
    getVersionInfo 
  } = useAppVersion();
  
  const handleUpdate = () => {
    if (isUpdateAvailable) {
      refreshApp();
    }
  };

  return (
    <div>
      <p>Version: {current}</p>
      {isUpdateAvailable && (
        <button onClick={handleUpdate}>
          Update Available - Click to Refresh
        </button>
      )}
    </div>
  );
}
```

### Programmatic Cache Control
```tsx
import { useAppVersion } from '@/hooks/useAppVersion';

function AdminPanel() {
  const { clearCache } = useAppVersion();
  
  const handleClearCache = async () => {
    const success = await clearCache();
    if (success) {
      alert('Cache cleared successfully!');
    }
  };
  
  return (
    <button onClick={handleClearCache}>
      Clear App Cache
    </button>
  );
}
```

## 🚨 When Versions Update

### Automatic Updates
- Every build gets a new version
- Users see update notification when available
- One-click update process

### Manual Version Control
If you want manual control, modify `scripts/generate-version.js`:
```javascript
// For manual versioning
const version = "1.2.3"; // Set your desired version
```

## 🔧 Customization

### Cache Timing
Modify cache TTL in service worker:
```javascript
// API cache duration (5 minutes)
maxAge: 5 * 60 * 1000

// Change to 1 hour
maxAge: 60 * 60 * 1000
```

### Update Notification Styling
Customize `AppUpdateNotification` component styling and behavior.

### Version Display
Toggle version info display in development:
```tsx
// Show version in dev mode only
{process.env.NODE_ENV === 'development' && (
  <VersionInfo />
)}
```

## 🐛 Troubleshooting

### Service Worker Not Updating
```bash
# Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Clear application data in DevTools
DevTools > Application > Storage > Clear site data
```

### Version Not Changing
```bash
# Check git status
git status

# Ensure you have commits
git add . && git commit -m "update"

# Rebuild
npm run build
```

### Cache Issues
```bash
# Clear all caches
npm run cache:clear

# Or in browser console
await caches.keys().then(names => 
  Promise.all(names.map(name => caches.delete(name)))
)
```

## 📊 Monitoring

### Version Info
```javascript
// In browser console
navigator.serviceWorker.controller?.postMessage({type: 'GET_VERSION'});
```

### Cache Status
```javascript
// Check cache names
caches.keys().then(console.log);

// Check specific cache contents
caches.open('mypal-business-admin-runtime-v{version}')
  .then(cache => cache.keys())
  .then(console.log);
```

## 🚀 Production Deployment

### Vercel
```json
// vercel.json
{
  "builds": [
    {
      "src": "next.config.js",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "BUILD_ENV": "production"
  }
}
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV BUILD_ENV=production
RUN npm run build:prod
EXPOSE 3000
CMD ["npm", "start"]
```

## ✅ Best Practices

1. **Always test updates** in staging first
2. **Monitor version adoption** in production
3. **Keep cache sizes reasonable** (< 50MB total)
4. **Version on major changes** but not every tiny edit
5. **Clear caches after major updates** to prevent issues

This system ensures your users always have the latest version while maintaining excellent performance through intelligent caching!