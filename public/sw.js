const CACHE_NAME = 'moms-journal-v1'

// Assets to cache for offline shell
const SHELL_ASSETS = [
  '/momsjournal/',
  '/momsjournal/manifest.json',
]

// Install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: "Mom's Journal 🌸", body: 'A new moment was shared!' }
  try {
    if (event.data) {
      const payload = event.data.json()
      data = payload.notification || payload.data || data
    }
  } catch (e) {
    // fallback to default
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/momsjournal/icons/icon-192.svg',
      badge: '/momsjournal/icons/icon-192.svg',
      data: data,
    })
  )
})

// Notification click — open the family feed or shared link
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.link || '/momsjournal/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/momsjournal/') && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})

// Fetch: network-first for API/data, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip Firebase/external API calls — always go to network
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com')
  ) {
    return
  }

  // For app assets: try network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
