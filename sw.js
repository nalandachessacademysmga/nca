// sw.js - Service Worker for Nalanda Chess Academy

// Define a cache name for versioning your cache.
// Increment this version number whenever you make changes to your static assets
// (e.g., update an image, CSS, or JS file) to ensure users get the latest content.
const CACHE_NAME = 'nalanda-chess-v2'; // IMPORTANT: Incremented version to force update

// List all the static assets you want to cache on installation.
// Include all HTML, CSS, JS, and image files that are critical for your site.
const urlsToCache = [
    '/', // Cache the root path (index.html)
    'index.html',
    'contact_us.html',
    'header.html', // Your common header
    'style.css',
    'script.js',
    'https://cdn.tailwindcss.com', // Tailwind CSS CDN
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css', // Font Awesome CDN
    'https://unpkg.com/chess.js@1.0.0-beta.7/chess.min.js', // Chess.js CDN
    'https://unpkg.com/@chrisoakley/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js', // Chessboard.js CDN
    'https://unpkg.com/@chrisoakley/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.css', // Chessboard.js CSS
    'https://firebasestorage.googleapis.com/v0/b/nalandachessacademy-474db.firebasestorage.app/o/App_assets%2Flogo.png?alt=media&token=023369a4-c43f-4278-8106-f21bcf2a350d', // Logo image    
	'https://firebasestorage.googleapis.com/v0/b/nalandachessacademy-474db.firebasestorage.app/o/App_assets%2FTournament.jpg?alt=media&token=a90b2b6b-0f44-4dda-a9aa-282cd0ab4016', // Hero image
    'https://firebasestorage.googleapis.com/v0/b/nalandachessacademy-474db.firebasestorage.app/o/App_assets%2FHeaderPic.jpg?alt=media&token=7b7464bd-9c50-43da-9907-054a5e45c659' // About Us image (still used on index.html)
];

// --- Install Event ---
// This event is fired when the service worker is first installed.
// It's a good place to pre-cache essential assets.
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching all app shell content');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('[Service Worker] Failed to cache during install:', error);
            })
    );
});

// --- Activate Event ---
// This event is fired when the service worker is activated.
// It's a good place to clean up old caches.
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Ensure the service worker takes control of the page immediately after activation
    return self.clients.claim();
});

// --- Fetch Event ---
// This event is fired for every network request made by the page.
// We can intercept these requests and serve cached content first.
self.addEventListener('fetch', (event) => {
    // Only handle GET requests and ignore requests for chrome-extension:// or other protocols
    if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
        return;
    }

    // Check if the request is for a Firebase Storage image or a known static asset
    const isFirebaseStorageAsset = event.request.url.includes('firebasestorage.googleapis.com/v0/b/nalandachessacademy-474db.firebasestorage.app/o/App_assets%2F');
    const isKnownStaticAsset = urlsToCache.some(url => event.request.url.includes(url));

    // For Firebase Storage images and other known static assets, use a cache-first strategy.
    // For other requests, fall back to network-only or network-first.
    if (isFirebaseStorageAsset || isKnownStaticAsset) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                // Cache hit - return response from cache
                if (response) {
                    console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
                    return response;
                }
                // No cache hit - fetch from network, then cache and return
                console.log(`[Service Worker] Fetching from network (and caching): ${event.request.url}`);
                return fetch(event.request).then((networkResponse) => {
                    // Check if we received a valid response and it's cacheable.
                    // For cross-origin requests, type can be 'cors'.
                    if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
                        return networkResponse;
                    }
                    // Clone the response because it's a stream and can only be consumed once
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                }).catch((error) => {
                    console.error(`[Service Worker] Fetch failed for ${event.request.url}:`, error);
                    // You could return a fallback page or image here for offline experience
                    // For now, we'll just let the fetch error propagate.
                    // Example: return caches.match('/offline.html');
                });
            })
        );
    } else {
        // For other requests (e.g., Firebase Auth, Firestore API calls),
        // let them go to the network directly.
        // This is a network-only or network-first strategy for dynamic content.
        event.respondWith(fetch(event.request));
    }
});
