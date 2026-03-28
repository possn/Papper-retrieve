const CACHE_NAME = ‘paperquest-v5’;
const STATIC_ASSETS = [
‘/’,
‘/index.html’,
‘https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap’
];

// Install - cache static assets
self.addEventListener(‘install’, function(e) {
e.waitUntil(
caches.open(CACHE_NAME).then(function(cache) {
return cache.addAll(STATIC_ASSETS);
}).then(function() {
return self.skipWaiting();
})
);
});

// Activate - clean old caches
self.addEventListener(‘activate’, function(e) {
e.waitUntil(
caches.keys().then(function(keys) {
return Promise.all(
keys.filter(function(k) { return k !== CACHE_NAME; })
.map(function(k) { return caches.delete(k); })
);
}).then(function() {
return self.clients.claim();
})
);
});

// Fetch - network first, cache fallback
self.addEventListener(‘fetch’, function(e) {
var url = e.request.url;

// Always network for API calls
if (url.includes(‘eutils.ncbi.nlm.nih.gov’) ||
url.includes(‘api.crossref.org’) ||
url.includes(‘api.unpaywall.org’) ||
url.includes(‘api.anthropic.com’) ||
url.includes(‘generativelanguage.googleapis.com’) ||
url.includes(‘workers.dev’) ||
url.includes(‘europepmc.org’)) {
return;
}

// Network first for main app
if (url.includes(‘paperquest.org’) || url.includes(‘localhost’)) {
e.respondWith(
fetch(e.request).then(function(response) {
var clone = response.clone();
caches.open(CACHE_NAME).then(function(cache) {
cache.put(e.request, clone);
});
return response;
}).catch(function() {
return caches.match(e.request).then(function(cached) {
return cached || caches.match(’/index.html’);
});
})
);
return;
}

// Cache first for fonts and CDN
e.respondWith(
caches.match(e.request).then(function(cached) {
if (cached) return cached;
return fetch(e.request).then(function(response) {
var clone = response.clone();
caches.open(CACHE_NAME).then(function(cache) {
cache.put(e.request, clone);
});
return response;
});
})
);
});
