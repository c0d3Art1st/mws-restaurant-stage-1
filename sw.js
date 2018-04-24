let self = this;
const STATIC_CACHE_NAME = "static-v1";
const DYN_CACHE_NAME = "dynamic-v1";
const FILE_LIMIT_DYN_CACHE = 50;

/**
 * Static files to cache on install-event of SW
 */
let staticFiles = [
	"/",
	"/index.html",
	"/offline.html",
	"/css/styles.css",
	"/js/idb.js",
	"/js/utility.js",
	"/js/app.js",
	"/js/dbhelper.js",
	"/js/main.js",
	"/js/restaurant_info.js"
];


self.addEventListener('install', event => {
	console.log("[ServiceWorker] Successfully installed SW")
	event.waitUntil(
		caches.open(STATIC_CACHE_NAME)
		.then(cache => {
			console.log("[ServiceWorker] Caching static files");
			return cache.addAll(staticFiles);
		})
		.catch(err => {
			console.log("[ServiceWorker] ERROR while caching static files: ", err);
		})
	);
});


self.addEventListener('fetch', event => {
	let requestUrl = new URL(event.request.url);

	if (!isGoogleOrigin(requestUrl.origin)) {
		// cache local content - CACHE FIRST NETWORK FALLBACK
		if (isRestaurantDataRequest(requestUrl.origin)) {
			// console.log("requesting Restaurant-JSON-data...");
		} else {
			event.respondWith(
				caches.match(event.request)
				.then(response => {
					if (response)
						return response;
					return fetch(event.request)
						.then(res => {
							return caches.open(DYN_CACHE_NAME)
								.then(cache => {
									trimCache(DYN_CACHE_NAME, FILE_LIMIT_DYN_CACHE);
									cache.put(event.request.url, res.clone());
									return res;
								});
						})
						.catch(err => {
							// fetch fallback page in case text-resource is requested
							return caches.open(STATIC_CACHE_NAME)
								.then(cache => {
									if (event.request.headers.get('accept').includes('text/html')) {
										return cache.match('/offline.html');
									} else {
										console.log("[ServiceWorker] ERROR while caching dynamic files: ", err);
									}
								});
						});
				})
			);
		}
	}
});


/**
 * Trim cache after max number of allowed items has been reached
 */
trimCache = (cacheName, maxItems) => {
	caches.open(cacheName)
		.then(cache => {
			return cache.keys()
				.then(keys => {
					if (keys.length > maxItems) {
						cache.delete(keys[0])
							.then(trimCache(cacheName, maxItems));
					}
				});
		})
}

/**
 * Determines if requested resource is located on a Google server
 */
isGoogleOrigin = (origin) => {
	return origin.startsWith('https://maps.googleapis.com') ||
		origin.startsWith('https://maps.gstatic.com') ||
		origin.startsWith('https://fonts.gstatic.com') ||
		origin.startsWith('https://fonts.googleapis.com');
}

/**
 * Determines if requested resource is restaurant-info from node-server
 */
isRestaurantDataRequest = (origin) => {
	return origin.startsWith('http://localhost:1337');
}
