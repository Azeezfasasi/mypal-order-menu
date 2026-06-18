// --- MyPal Business Admin Service Worker ---
// Single file for caching, offline, API handling, and Firebase messaging
//
// Documentation / Policy
// - This service worker runs at root scope and is the only SW registered for the app.
// - Development mode (localhost) disables caching and heavy processing to avoid
//   interference during local dev and HMR.
// - Static assets (images, icons, manifest) are cached long-term using a versioned
//   STATIC_CACHE so we can reliably purge caches on release.
// - Runtime navigation responses and generic assets are cached to improve offline UX.
// - API requests are treated conservatively: only same-origin requests under `/api/`
//   are considered API requests. By default API responses are NOT cached to avoid
//   serving stale server-side state. If you have safe-to-cache API endpoints, add
//   them to `API_CACHE_ALLOWLIST` below and they will be cached with a short TTL.
// - Push notifications and Firebase Messaging background handlers are included.
//
// How to extend safely:
// - Add explicit allowlisted API paths to API_CACHE_ALLOWLIST (exact pathname matches
//   or prefix matches) only for idempotent, cacheable endpoints (e.g. public lists).
// - Use the client `GET_VERSION` message to check SW version and `SKIP_WAITING` to
//   activate a new SW from the client when appropriate.

// Build/version placeholders replaced at build time by scripts. Fall back to unique dev values.
const BUILD_VERSION = typeof dev !== "undefined" ? dev : `dev-${Date.now()}`;
const BUILD_TIME =
  typeof __BUILD_TIME__ !== "undefined"
    ? __BUILD_TIME__
    : new Date().toISOString();

const CACHE_PREFIX = "mypal-business-admin";
const CACHE_VERSION = BUILD_VERSION;
const STATIC_CACHE = `${CACHE_PREFIX}-static-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-v${CACHE_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}-api-v${CACHE_VERSION}`;

// Static assets that rarely change
const staticAssets = [
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/manifest.json",
];

// API allowlist for caching (use only for safe, idempotent endpoints). Example: ['/api/public/list']
const API_CACHE_ALLOWLIST = [];

// Helper: detect development
function isDev() {
  return location.hostname === "localhost" || location.hostname === "127.0.0.1";
}

// Install: cache static assets (skip heavy caching in dev)
self.addEventListener("install", (event) => {
  console.log(`SW: Installing version ${CACHE_VERSION}`);
  if (isDev()) {
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll(staticAssets).catch((err) => {
          console.warn("SW: Some static assets failed to cache:", err);
          return Promise.resolve();
        }),
      )
      .then(() => self.skipWaiting()),
  );
});

// Activate: cleanup old caches, claim clients, notify of update
self.addEventListener("activate", (event) => {
  console.log(`SW: Activating version ${CACHE_VERSION}`);
  event.waitUntil(
    cleanupOldCaches()
      .then(() => self.clients.claim())
      .then(() => notifyClientsOfUpdate()),
  );
});

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const current = [STATIC_CACHE, RUNTIME_CACHE, API_CACHE];
    const toDelete = cacheNames.filter(
      (n) => n.startsWith(CACHE_PREFIX) && !current.includes(n),
    );
    if (toDelete.length) console.log("SW: Deleting old caches:", toDelete);
    return Promise.all(toDelete.map((n) => caches.delete(n)));
  } catch (err) {
    console.warn("SW: cleanupOldCaches error:", err);
  }
}

async function notifyClientsOfUpdate() {
  try {
    const clientList = await self.clients.matchAll();
    clientList.forEach((client) => {
      client.postMessage({
        type: "SW_UPDATED",
        version: CACHE_VERSION,
        buildTime: BUILD_TIME,
        timestamp: Date.now(),
      });
    });
    if (clientList.length)
      console.log(`SW: Notified ${clientList.length} clients of update`);
  } catch (err) {
    console.warn("SW: notifyClientsOfUpdate failed:", err);
  }
}

// Fetch handler - skip dev and sensitive routes
self.addEventListener("fetch", (event) => {
  if (isDev()) return;
  const { request } = event;
  // Only handle GET http(s) same-origin requests
  if (request.method !== "GET") return;
  if (!request.url.startsWith("http")) return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // Skip HMR, Next internals and auth/api paths from SW handling
  const skipPatterns = [
    "/_next/webpack-hmr",
    "/_next/static/webpack/",
    "/__nextjs_original-stack-frame",
    "/login",
    "/signup",
    "/verify",
    "/kyb",
    "/reset-password",
    "/forgot-password",
  ];
  if (skipPatterns.some((p) => request.url.includes(p))) return;

  // Route strategies
  if (isApiRequest(request.url)) {
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(request.url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else if (isStaticResource(request.url)) {
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// --- Request classification helpers ---
function isApiRequest(url) {
  try {
    const u = new URL(url);
    // only consider same-origin API requests
    if (u.origin !== location.origin) return false;
    return u.pathname.startsWith("/api/");
  } catch (err) {
    console.warn("SW: isApiRequest parse failed:", err);
    return false;
  }
}
function isStaticAsset(url) {
  return /\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/i.test(url);
}
function isNavigationRequest(request) {
  return request.mode === "navigate";
}
function isStaticResource(url) {
  return /\.(js|css|map)$/i.test(url) && url.includes("/_next/static/");
}

// --- Strategies / handlers ---
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const url = new URL(request.url);
  try {
    const networkResponse = await fetch(request);
    // Only cache if the endpoint is allowlisted and it's a 200 GET basic response
    if (
      request.method === "GET" &&
      networkResponse &&
      networkResponse.status === 200 &&
      API_CACHE_ALLOWLIST.some((p) => url.pathname.startsWith(p))
    ) {
      const resp = addCacheMetadata(networkResponse.clone(), {
        cached: Date.now(),
        maxAge: 5 * 60 * 1000,
      });
      cache.put(request, resp);
    }
    return networkResponse;
  } catch (err) {
    // If network fails, return cached allowlisted response if recent
    if (request.method === "GET") {
      const cached = await cache.match(request);
      if (cached) {
        const meta = getCacheMetadata(cached);
        const age = Date.now() - (meta.cached || 0);
        if (age < (meta.maxAge || 0)) return cached;
      }
    }
    throw err;
  }
}

async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200)
      cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (err) {
    console.warn("SW: Failed to fetch static asset", request.url, err);
    throw err;
  }
}

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(
        request,
        addCacheMetadata(networkResponse.clone(), {
          cached: Date.now(),
          version: CACHE_VERSION,
        }),
      );
    }
    return networkResponse;
  } catch (err) {
    console.warn("SW: Navigation request failed:", err);
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    return createOfflinePage();
  }
}

async function handleGenericRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(
        request,
        addCacheMetadata(networkResponse.clone(), {
          cached: Date.now(),
          version: CACHE_VERSION,
        }),
      );
    }
    return networkResponse;
  } catch (err) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200)
        cache.put(
          request,
          addCacheMetadata(networkResponse.clone(), {
            cached: Date.now(),
            version: CACHE_VERSION,
          }),
        );
      return networkResponse;
    })
    .catch((err) => {
      console.warn("SW: background fetch failed", err);
      return null;
    });
  if (cachedResponse) return cachedResponse;
  return fetchPromise;
}

// --- Cache metadata helpers ---
function addCacheMetadata(response, metadata) {
  try {
    const headers = new Headers(response.headers);
    headers.set("sw-cache-version", CACHE_VERSION);
    headers.set("sw-cache-metadata", JSON.stringify(metadata));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    console.warn("SW: addCacheMetadata failed:", err);
    return response;
  }
}

function getCacheMetadata(response) {
  try {
    const header = response.headers.get("sw-cache-metadata");
    if (!header) return {};
    return JSON.parse(header);
  } catch (err) {
    console.warn("SW: getCacheMetadata failed:", err);
    return {};
  }
}

function createOfflinePage() {
  return new Response(
    `<!DOCTYPE html><html><head><title>Offline - MyPal Business Admin</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-align:center;padding:50px 20px;background:#f8fafc;color:#334155}.offline-content{max-width:400px;margin:0 auto;background:white;padding:40px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.08)}.logo{width:64px;height:64px;background:#f97316;border-radius:12px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:bold}h1{color:#1e293b;margin-bottom:12px}p{color:#64748b;margin-bottom:24px}button{background:#f97316;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:16px;cursor:pointer}button:hover{background:#ea580c}.version{margin-top:20px;font-size:12px;color:#94a3b8}</style></head><body><div class="offline-content"><div class="logo">MP</div><h1>You're Offline</h1><p>Please check your internet connection and try again.</p><button onclick="window.location.reload()">Retry Connection</button><div class="version">v${CACHE_VERSION}</div></div></body></html>`,
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: {
        "Content-Type": "text/html",
        "sw-cache-version": CACHE_VERSION,
      },
    },
  );
}

// --- Push / Notification handlers ---
self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || "You have a new notification",
      icon: data.icon || "/android-chrome-192x192.png",
      badge: "/favicon-32x32.png",
      vibrate: [100, 50, 100],
      sound: "/sounds/notification.mp3", // Add notification sound for both mobile and desktop
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.id || "notification",
        url:
          data.url ||
          "https://business.mypal-inc.com" ||
          "https://mypal-business-admin.onrender.com",
        version: CACHE_VERSION,
        ...data,
      },
      actions: [
        { action: "open", title: "Open App" },
        { action: "dismiss", title: "Dismiss" },
      ],
      requireInteraction: true,
      tag: data.tag || "default",
    };
    event.waitUntil(
      self.registration.showNotification(
        data.title || "MyPal Business",
        options,
      ),
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  // Track notification interaction
  const notificationId =
    event.notification.data?.id || event.notification.data?.primaryKey;
  if (notificationId && event.action !== "dismiss") {
    // Mark notification as read when clicked (non-blocking)
    markNotificationAsReadInSW(notificationId).catch((err) =>
      console.warn("SW: Failed to mark notification as read:", err),
    );
  }

  if (event.action === "dismiss") return;

  const targetUrl =
    event.notification.data?.url || "https://business.mypal-inc.com";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          try {
            const clientUrl = new URL(client.url);
            const targetUrlObj = new URL(targetUrl);
            if (clientUrl.origin === targetUrlObj.origin && "focus" in client)
              return client.focus();
          } catch (e) {
            console.warn("SW: malformed client URL in notificationclick:", e);
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      }),
  );
});

// Helper function to mark notification as read in service worker context
async function markNotificationAsReadInSW(notificationId) {
  try {
    const response = await fetch(
      `${self.location.origin}/api/notifications/${notificationId}/read`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "{{API_KEY}}", // This will be replaced by build script
        },
      },
    );

    if (response.ok) {
      console.log(`SW: Marked notification ${notificationId} as read`);
    } else {
      console.warn(
        `SW: Failed to mark notification ${notificationId} as read:`,
        response.status,
      );
    }
  } catch (error) {
    console.warn(`SW: Error marking notification as read:`, error);
  }
}

// --- Firebase Messaging Integration (import compat libs) ---
importScripts(
  "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js",
);

const firebaseConfig = {
  apiKey: "AIzaSyC0jnRI5bEfOOA43fodGn1aC0TMo9oSl90",
  authDomain: "mypal-9a868.firebaseapp.com",
  projectId: "mypal-9a868",
  messagingSenderId: "145115867544",
  measurementId: "G-3RD6HVXCN5",
  appId: "1:145115867544:web:c29a8ae184231c884ca3ed",
};

try {
  const app = firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging(app);
  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || "MyPal Business";
    const notificationOptions = {
      body: payload.notification?.body || "You have a new notification",
      icon: payload.notification?.icon || "/android-chrome-192x192.png",
      badge: "/favicon-32x32.png",
      vibrate: [100, 50, 100],
      sound: "/sounds/notification.mp3", // Add notification sound for both mobile and desktop
      data: {
        dateOfArrival: Date.now(),
        primaryKey: payload.data?.id || "notification",
        url: payload.data?.url || "https://business.mypal-inc.com",
        ...payload.data,
      },
      actions: [
        { action: "open", title: "Open App" },
        { action: "dismiss", title: "Dismiss" },
      ],
      requireInteraction: true,
      tag: payload.data?.tag || "default",
      renotify: true,
    };
    return self.registration.showNotification(
      notificationTitle,
      notificationOptions,
    );
  });
} catch (err) {
  console.warn("SW: Firebase messaging initialization failed:", err);
}

// Messages from client: SKIP_WAITING, GET_VERSION, and NOTIFICATION_API
self.addEventListener("message", async (event) => {
  if (!event.data) return;

  const { type, data } = event.data;

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "GET_VERSION":
      // respond via MessageChannel if port provided
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          version: CACHE_VERSION,
          buildTime: BUILD_TIME,
        });
      } else if (event.source && event.source.postMessage) {
        event.source.postMessage({
          type: "SW_VERSION",
          version: CACHE_VERSION,
          buildTime: BUILD_TIME,
        });
      }
      break;

    case "MARK_NOTIFICATION_READ":
      // Mark notification as read from service worker
      if (data?.notificationId) {
        try {
          await markNotificationAsReadInSW(data.notificationId);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
          }
        } catch (error) {
          console.error("SW: Failed to mark notification as read:", error);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
              success: false,
              error: error.message,
            });
          }
        }
      }
      break;

    case "GET_UNREAD_COUNT":
      // Get unread count from service worker
      try {
        const count = await getUnreadCountInSW();
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true, count });
        }
      } catch (error) {
        console.error("SW: Failed to get unread count:", error);
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: error.message });
        }
      }
      break;

    default:
      // Unknown message type
      break;
  }
});

// Helper function to get unread count in service worker context
async function getUnreadCountInSW() {
  try {
    const response = await fetch(
      `${self.location.origin}/api/notifications/unread-count`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "{{API_KEY}}", // This will be replaced by build script
        },
      },
    );

    if (response.ok) {
      const data = await response.json();
      return data.data?.count || 0;
    } else {
      console.warn(`SW: Failed to get unread count:`, response.status);
      return 0;
    }
  } catch (error) {
    console.warn(`SW: Error getting unread count:`, error);
    return 0;
  }
}
