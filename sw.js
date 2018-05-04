let self = this;

importScripts('/js/idb.js');
importScripts('/js/idb_utility.js');


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

self.addEventListener('activate', function(event) {
	console.log('[Service Worker] Activating Service Worker ....', event);
	event.waitUntil(
		caches.keys()
		.then(function(keyList) {
			return Promise.all(keyList.map(function(key) {
				if (key !== STATIC_CACHE_NAME && key !== DYN_CACHE_NAME) {
					console.log('[Service Worker] Removing old cache: ', key);
					return caches.delete(key);
				}
			}));
		})
	);
	return self.clients.claim();
});

self.addEventListener('fetch', event => {
	let requestUrl = new URL(event.request.url);

	if (!isGoogleMapsOrigin(requestUrl.origin)) {
		// cache local content - CACHE FIRST NETWORK FALLBACK
		if (isRestaurantDataRequest(requestUrl.origin)) {
			event.respondWith(serveIdbData(event.request));
		} else {
			event.respondWith(serveCachedData(event.request));
		}
	}
});

/**
 * Strategy for dynamic data (restaurant-info from node-server)
 */
serveIdbData = (request) => {
	return readAllData(IDB_NAME)
	.then(data => {
		if (data.length > 0) {
			var blob = new Blob([JSON.stringify(data, null, 2)], {
				type: 'application/json'
			});
			var init = { 'status': 200, 'statusText': 'super-Great'};
			// try network-fetch to update idb
			updateRestaurantsFromNetwork(request)
			return new Response(blob, init);
		} else {
			return updateRestaurantsFromNetwork(request);
		}
	})
	.catch(error => {
		console.log("[ServiceWorker] ERROR while fetching idb-data: ", error);
	})
}

/**
 * Strategy for static data (app-shell)
 */
serveCachedData = (request) => {
	return caches.match(request)
	.then(response => {
		if (response)
			return response;
		return fetch(request)
			.then(res => {
				return caches.open(DYN_CACHE_NAME)
					.then(cache => {
						trimCache(DYN_CACHE_NAME, FILE_LIMIT_DYN_CACHE);
						cache.put(request.url, res.clone());
						return res;
					});
			})
			.catch(err => {
				// fetch fallback page in case text-resource is requested
				return caches.open(STATIC_CACHE_NAME)
					.then(cache => {
						if (request.headers.get('accept').includes('text/html')) {
							return cache.match('/offline.html');
						} else {
							console.log("[ServiceWorker] ERROR while caching dynamic files: ", err);
						}
					});
			});
	})
}

/**
 * Retrieves Restraurant-info from network and updated IndexedDB with it
 */
updateRestaurantsFromNetwork = (request) => {
	return fetch(request)
		.then(response => {
			let clonedRes = response.clone();
			clearAllData(IDB_NAME)
				.then(() => {
					return clonedRes.json();
				})
				.then(data => {
					let id = 1;
					for (let key in data) {
						let current = data[key];
						let tmp = {};
						tmp.id = id;
						tmp.name = current.name;
						tmp.neighborhood = current.neighborhood;
						tmp.operating_hours = current.operating_hours;
						tmp.photograph = current.photograph;
						tmp.address = current.address;
						tmp.latlng = current.latlng;
						tmp.cuisine_type = current.cuisine_type;
						tmp.reviews = current.reviews;
						writeData(IDB_NAME, tmp)
						id++;
					}
				});
			return response;
		});
}

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
isGoogleMapsOrigin = (origin) => {
	return origin.startsWith('https://maps.googleapis.com') ||
		origin.startsWith('https://maps.gstatic.com');
}

/**
 * Determines if requested resource is restaurant-info from node-server
 */
isRestaurantDataRequest = (origin) => {
	return origin.startsWith('http://localhost:1337');
}
