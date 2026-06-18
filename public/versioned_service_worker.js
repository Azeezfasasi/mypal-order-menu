// Get build version from Next.js build process
// This will be replaced during build with actual version
const BUILD_VERSION =
  typeof __BUILD_VERSION__ !== "undefined"
    ? __BUILD_VERSION__
    : "dev-" + Date.now();

const BUILD_TIME =
  typeof __BUILD_TIME__ !== "undefined"
    ? __BUILD_TIME__
    : new Date().toISOString();

// Cache names with versioning
const CACHE_PREFIX = "mypal-business-admin";
const CACHE_VERSION = BUILD_VERSION;
const STATIC_CACHE = `${CACHE_PREFIX}-static-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-v${CACHE_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}-api-v${CACHE_VERSION}`;

console.log(`🔧 Service Worker v${CACHE_VERSION} initializing...`);
console.log(`📅 Build time: ${BUILD_TIME}`);

// Static assets that rarely change
const staticAssets = [
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/manifest.json",
];

// Install event - cache essential static resources
self.addEventListener("install", (event) => {
  console.log(`📦 Installing SW v${CACHE_VERSION}`);

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("Caching static assets...");
        return cache.addAll(staticAssets).catch((error) => {
          console.warn("Failed to cache some static assets:", error);
          // Don't fail the install if some assets fail to cache
          return Promise.resolve();
        });
      }),
      // Force immediate activation
      self.skipWaiting(),
    ]).then(() => {
      console.log(`✅ SW v${CACHE_VERSION} installed successfully`);
    })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener("activate", (event) => {
  console.log(`🔄 Activating SW v${CACHE_VERSION}`);

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      // Take control of all clients immediately
      self.clients.claim(),
      // Notify clients of update
      notifyClientsOfUpdate(),
    ]).then(() => {
      console.log(`✅ SW v${CACHE_VERSION} activated successfully`);
    })
  );
});

// Clean up old caches
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE, API_CACHE];

  const cachesToDelete = cacheNames.filter((cacheName) => {
    // Delete old mypal caches that aren't current
    if (
      cacheName.startsWith(CACHE_PREFIX) &&
      !currentCaches.includes(cacheName)
    ) {
      return true;
    }
    return false;
  });

  console.log(
    `🗑️ Deleting ${cachesToDelete.length} old caches:`,
    cachesToDelete
  );

  return Promise.all(
    cachesToDelete.map((cacheName) => {
      console.log(`Deleting cache: ${cacheName}`);
      return caches.delete(cacheName);
    })
  );
}

// Notify clients when a new version is available
async function notifyClientsOfUpdate() {
  const clients = await self.clients.matchAll();

  clients.forEach((client) => {
    client.postMessage({
      type: "SW_UPDATED",
      version: CACHE_VERSION,
      buildTime: BUILD_TIME,
      timestamp: Date.now(),
    });
  });

  console.log(`📢 Notified ${clients.length} clients of update`);
}

// Enhanced fetch event with versioned caching
self.addEventListener("fetch", (event) => {
  const { request } = event;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip non-http(s) requests
  if (!request.url.startsWith("http")) {
    return;
  }

  // Skip webpack HMR and dev server requests
  if (
    request.url.includes("/_next/webpack-hmr") ||
    request.url.includes("/__nextjs_original-stack-frame") ||
    request.url.includes("/_next/static/webpack/")
  ) {
    return;
  }

  // Handle different request types
  if (isApiRequest(request.url)) {
    // API requests: Network first with short-term cache
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(request.url)) {
    // Static assets: Cache first with long-term cache
    event.respondWith(handleStaticAsset(request));
  } else if (isNavigationRequest(request)) {
    // HTML pages: Network first with cache fallback
    event.respondWith(handleNavigationRequest(request));
  } else if (isStaticResource(request.url)) {
    // JS/CSS bundles: Stale while revalidate
    event.respondWith(handleStaticResource(request));
  } else {
    // Everything else: Network first
    event.respondWith(handleGenericRequest(request));
  }
});

// Helper functions to classify requests
function isApiRequest(url) {
  return url.includes("/api/") || url.includes("api.mypal");
}

function isStaticAsset(url) {
  return /\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/i.test(url);
}

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

function isStaticResource(url) {
  return /\.(js|css)$/i.test(url) && url.includes("/_next/static/");
}

// Request handlers with versioning
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);

  try {
    // Always try network first for API requests
    const networkResponse = await fetch(request);

    // Cache successful GET requests briefly (5 minutes)
    if (networkResponse.status === 200 && request.method === "GET") {
      const responseWithMetadata = addCacheMetadata(networkResponse.clone(), {
        cached: Date.now(),
        maxAge: 5 * 60 * 1000, // 5 minutes
      });
      cache.put(request, responseWithMetadata);
    }

    return networkResponse;
  } catch (error) {
    // Try cache as fallback
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const cacheMetadata = getCacheMetadata(cachedResponse);
      const age = Date.now() - cacheMetadata.cached;

      // Only use cached API responses if they're recent
      if (age < cacheMetadata.maxAge) {
        console.log(
          `📦 Serving cached API response (${Math.round(age / 1000)}s old)`
        );
        return cachedResponse;
      }
    }

    throw error;
  }
}

async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn("Failed to fetch static asset:", request.url);
    throw error;
  }
}

async function handleNavigationRequest(request) {
  try {
    // Always try network first for navigation
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      const responseWithMetadata = addCacheMetadata(networkResponse.clone(), {
        cached: Date.now(),
        version: CACHE_VERSION,
      });
      cache.put(request, responseWithMetadata);
    }

    return networkResponse;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.log("Network failed for navigation, trying cache:", request.url);

    // Network failed, try cache
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page if no cache available
    return createOfflinePage();
  }
}

async function handleStaticResource(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  // Get cached response
  const cachedResponse = await cache.match(request);

  // Fetch in background and update cache
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.status === 200) {
        const responseWithMetadata = addCacheMetadata(networkResponse.clone(), {
          cached: Date.now(),
          version: CACHE_VERSION,
        });
        cache.put(request, responseWithMetadata);
      }
      return networkResponse;
    })
    .catch((error) => {
      console.warn("Background fetch failed:", error);
      return null;
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Wait for network if no cache
  return fetchPromise;
}

async function handleGenericRequest(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses briefly
    if (networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      const responseWithMetadata = addCacheMetadata(networkResponse.clone(), {
        cached: Date.now(),
        version: CACHE_VERSION,
      });
      cache.put(request, responseWithMetadata);
    }

    return networkResponse;
  } catch (error) {
    // Try cache as fallback
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Utility functions
function addCacheMetadata(response, metadata) {
  const headers = new Headers(response.headers);
  headers.set("sw-cache-version", CACHE_VERSION);
  headers.set("sw-cache-metadata", JSON.stringify(metadata));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}

function getCacheMetadata(response) {
  const metadataHeader = response.headers.get("sw-cache-metadata");
  if (metadataHeader) {
    try {
      return JSON.parse(metadataHeader);
    } catch (error) {
      console.warn("Failed to parse cache metadata:", error);
    }
  }
  return { cached: 0, maxAge: 0 };
}

function createOfflinePage() {
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Offline - MyPal Business Admin</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          text-align: center; 
          padding: 50px 20px;
          background: #f8fafc;
          color: #334155;
        }
        .offline-content { 
          max-width: 400px; 
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .logo { 
          width: 64px; 
          height: 64px; 
          background: #f97316;
          border-radius: 12px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
        }
        h1 { color: #1e293b; margin-bottom: 12px; }
        p { color: #64748b; margin-bottom: 24px; }
        button { 
          background: #f97316;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s;
        }
        button:hover { background: #ea580c; }
        .version { 
          margin-top: 20px;
          font-size: 12px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="offline-content">
        <div class="logo">MP</div>
        <h1>You're Offline</h1>
        <p>Please check your internet connection and try again.</p>
        <button onclick="window.location.reload()">Retry Connection</button>
        <div class="version">v${CACHE_VERSION}</div>
      </div>
    </body>
    </html>
  `,
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: {
        "Content-Type": "text/html",
        "sw-cache-version": CACHE_VERSION,
      },
    }
  );
}

// Push notification handlers
self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/android-chrome-192x192.png",
      badge: "/favicon-32x32.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.id || "notification",
        url: data.url || "https://business.mypal-inc.com",
        version: CACHE_VERSION,
      },
      actions: [
        {
          action: "open",
          title: "Open App",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
      requireInteraction: true,
      tag: data.tag || "default",
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received.");
  event.notification.close();

  if (event.action === "dismiss") {
    return; // Do nothing for dismiss action
  }

  const targetUrl =
    event.notification.data?.url || "https://business.mypal-inc.com";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if the app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          const clientUrl = new URL(client.url);
          const targetUrlObj = new URL(targetUrl);

          if (clientUrl.origin === targetUrlObj.origin && "focus" in client) {
            return client.focus();
          }
        }

        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle messages from the main app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("📨 Received SKIP_WAITING message");
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      buildTime: BUILD_TIME,
    });
  }
});
