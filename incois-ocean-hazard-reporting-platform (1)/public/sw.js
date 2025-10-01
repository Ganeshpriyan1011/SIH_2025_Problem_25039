// INCOIS Ocean Hazard Reporting Platform - Service Worker
// Provides offline capabilities and caching for better performance

const CACHE_NAME = 'incois-hazard-v1.2.0';
const STATIC_CACHE = 'incois-static-v1.2.0';
const DYNAMIC_CACHE = 'incois-dynamic-v1.2.0';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets as needed
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/reports',
  '/api/social-media',
  '/api/hotspots',
  '/api/multilingual'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleOtherRequests(request));
  }
});

// Check if request is for static assets
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.html') ||
         url.pathname === '/' ||
         url.pathname.includes('/assets/');
}

// Check if request is for API
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

// Check if request is for images
function isImageRequest(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i);
}

// Handle static assets - Cache First strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Static asset fetch failed:', error);
    // Return offline page or fallback
    return new Response('Offline - Static asset not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle API requests - Network First with cache fallback
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for certain endpoints
      if (shouldCacheAPIResponse(url.pathname)) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Serving API response from cache:', url.pathname);
      return cachedResponse;
    }
    
    return networkResponse;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Serving API response from cache (offline):', url.pathname);
      return cachedResponse;
    }
    
    // Return offline response for specific endpoints
    if (url.pathname.includes('/reports')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Offline - Reports not available',
        offline: true,
        cached: false
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Network unavailable',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle image requests - Cache First with network fallback
async function handleImageRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Image fetch failed:', error);
    
    // Try cache again
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return placeholder image
    return new Response('', {
      status: 503,
      statusText: 'Image not available offline'
    });
  }
}

// Handle other requests - Network First
async function handleOtherRequests(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Determine if API response should be cached
function shouldCacheAPIResponse(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pathname.includes(pattern)) &&
         !pathname.includes('/auth/') && // Don't cache auth requests
         !pathname.includes('/upload'); // Don't cache upload requests
}

// Background sync for offline reports
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'sync-offline-reports') {
    event.waitUntil(syncOfflineReports());
  }
});

// Sync offline reports when connection is restored
async function syncOfflineReports() {
  try {
    console.log('🔄 Syncing offline reports...');
    
    // Get offline reports from IndexedDB or localStorage
    const offlineReports = await getOfflineReports();
    
    if (offlineReports.length === 0) {
      console.log('✅ No offline reports to sync');
      return;
    }
    
    let syncedCount = 0;
    for (const report of offlineReports) {
      try {
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${report.token}`
          },
          body: JSON.stringify(report.data)
        });
        
        if (response.ok) {
          await removeOfflineReport(report.id);
          syncedCount++;
          console.log(`✅ Synced offline report: ${report.id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to sync report ${report.id}:`, error);
      }
    }
    
    console.log(`🎉 Synced ${syncedCount}/${offlineReports.length} offline reports`);
    
    // Notify the main thread
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        syncedCount,
        totalCount: offlineReports.length
      });
    });
    
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Helper functions for offline report management
async function getOfflineReports() {
  // This would typically use IndexedDB
  // For now, return empty array as placeholder
  return [];
}

async function removeOfflineReport(reportId) {
  // Remove from IndexedDB or localStorage
  console.log(`Removing offline report: ${reportId}`);
}

// Handle push notifications for emergency alerts
self.addEventListener('push', (event) => {
  console.log('📢 Service Worker: Push notification received');
  
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'New ocean hazard alert',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.tag || 'hazard-alert',
      requireInteraction: data.urgent || false,
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      data: {
        url: data.url || '/',
        timestamp: Date.now()
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'INCOIS Alert', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

console.log('🌊 INCOIS Ocean Hazard Reporting Platform Service Worker loaded');
