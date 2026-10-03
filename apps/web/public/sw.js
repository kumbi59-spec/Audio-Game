/**
 * EchoQuest service worker.
 *
 * Strategy:
 *   - Build assets (/_next/static, content-hashed) and public images/fonts:
 *     cache-first with background refresh.
 *   - Page navigations: network-first. Only public pages are cached (see
 *     CACHEABLE_PAGES), so a signed-in page never outlives its session on a
 *     shared device. Offline, a navigation falls back to the cached page or
 *     the offline shell.
 *   - Everything else (API routes, streaming audio, React Server Component
 *     payloads): network-only, never cached.
 *
 * The cache is named after the build (?v= on registration), so each deploy
 * starts clean and activate() deletes the previous one.
 */

const BUILD = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE = `echoquest-${BUILD}`;

const PRECACHE = ["/", "/offline.html"];

// Public, same-for-everyone pages that are safe to keep for offline use.
const CACHEABLE_PAGES = [/^\/$/, /^\/about\/?$/, /^\/blog(\/[^/]+)?\/?$/, /^\/campaigns(\/[^/]+)?\/?$/, /^\/privacy\/?$/, /^\/terms\/?$/, /^\/contact-us\/?$/];

const STATIC_EXTENSIONS = /\.(woff2?|ttf|otf|png|jpg|jpeg|svg|ico|webp|avif|gif)$/i;

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

  // Content-hashed build assets and public media: cache-first.
  if (url.pathname.startsWith("/_next/static/") || STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Page navigations: network-first, cached only when the page is public.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, CACHEABLE_PAGES.some((re) => re.test(url.pathname))));
    return;
  }

  // API routes, streaming audio, RSC payloads (client-side navigation data)
  // and anything else: always from the network, never stored.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkOnly(request));
  }
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

async function networkFirst(request, cacheable) {
  try {
    const res = await fetch(request);
    if (cacheable && res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = cacheable ? await caches.match(request) : undefined;
    if (cached) return cached;
    // Last resort: serve the offline shell.
    const shell = await caches.match("/offline.html");
    return shell ?? new Response("You are offline.", { status: 503, headers: { "Content-Type": "text/html" } });
  }
}
