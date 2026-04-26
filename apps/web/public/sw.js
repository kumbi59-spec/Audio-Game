/**
 * EchoQuest service worker.
 *
 * Strategy:
 *   - Static assets (JS, CSS, fonts, images): cache-first with background refresh
 *   - HTML navigation: network-first, fall back to cached shell
 *   - /api/* routes: network-only (require live Anthropic connection)
 *   - /tts/*, /stt/*: network-only (streaming audio — not cacheable)
 */

const CACHE = "echoquest-v1";

const PRECACHE = [
  "/",
  "/library",
  "/create",
  "/offline.html",
];

const STATIC_EXTENSIONS = /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|ico|webp)$/i;

// ── Install: precache the shell ───────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(PRECACHE).catch(() => {
        // If precache fails (e.g. offline at install), just skip.
      }),
    ),
  );
  self.skipWaiting();
});

// ── Activate: remove stale caches ────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// ── Fetch: route by URL pattern ───────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests.
  if (request.method !== "GET") return;

  // Skip cross-origin requests.
  if (url.origin !== self.location.origin) return;

  // API and streaming routes: always network-only.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/tts/") ||
    url.pathname.startsWith("/stt/") ||
    url.pathname.startsWith("/session")
  ) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Static assets: cache-first, update in background.
  if (STATIC_EXTENSIONS.test(url.pathname) || url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages: network-first, fall back to shell.
  event.respondWith(networkFirst(request));
});

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "EchoQuest", body: event.data.text(), url: "/" };
  }

  const title = payload.title ?? "EchoQuest";
  const options = {
    body: payload.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    data: { url: payload.url ?? "/" },
    vibrate: [100, 50, 100],
    tag: "echoquest",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const existing = windowClients.find((c) => c.url.includes(self.location.origin));
        if (existing) return existing.focus().then((c) => c.navigate(url));
        return clients.openWindow(url);
      }),
  );
});

// ── Strategies ────────────────────────────────────────────────────────────────

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({ error: "offline", message: "No internet connection." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Refresh in background without waiting.
    void fetch(request)
      .then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(request, res));
      })
      .catch(() => undefined);
    return cached;
  }
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return new Response("Asset unavailable offline.", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Last resort: serve the offline shell.
    const shell = await caches.match("/offline.html");
    return shell ?? new Response("You are offline.", { status: 503, headers: { "Content-Type": "text/html" } });
  }
}
