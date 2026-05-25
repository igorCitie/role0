const CACHE_NAME = 'role0-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Don't cache chrome-extension:// or other non-http schemes
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, resClone);
          }
        });
        return response;
      })
      .catch(async () => {
        // If network fails, try the cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If it's a navigation request and we're offline, we could return a custom offline page here
        // For now we just return a 404 response
        return new Response('Você está offline. Verifique sua conexão.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain',
          }),
        });
      })
  );
});
