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
	"/css/common.css",
	"/css/main.css",
	"/js/idb.js",
	"/js/idb_utility.js",
	"/js/gui_utility.js",
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
	console.log('[Service Worker] Activating Service Worker ...');
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

self.addEventListener('sync', event => {
	console.log("[Service Worker] Background Syncing...");
	if (event.tag === "sync-new-favorite") {
		event.waitUntil(syncFavorRequest());
	} else {
		event.waitUntil(syncReviewRequest());
	}

});

function syncReviewRequest() {
	readAllData(REVIEW_SYNC_STORE)
	.then(data => {
		// sync each stored favorite sync request
		for (let dt of data) {
			fetch(`http://localhost:1337/reviews/`, {
				method: "POST",
				headers: new Headers({
					"Content-Type": "application/json",
					"Accept": "application/json"
				}),
				body: JSON.stringify(dt.review)
			})
			.then(res => {
				deleteItem(REVIEW_SYNC_STORE, dt.id);
			})
			.catch(err => {
				console.log("error while posting review: ", error);
			})
		 }
	})
	.catch(err => {
		console.log("Error while doing background-sync: ", err);
	})
}

function syncFavorRequest() {
	readAllData(FAVORITE_SYNC_STORE)
	.then(data => {
		// sync each stored favorite sync request
		for (let dt of data) {
			let favoriteVal = (dt.is_favorite === "true") ? "false" : "true";
			fetch(`http://localhost:1337/restaurants/${dt.id}/?is_favorite=${favoriteVal}`, {
				method: "PUT"
			})
			.then(res => {
				deleteItem(FAVORITE_SYNC_STORE, dt.id);
			})
		 }
	})
	.catch(err => {
		console.log("Error while doing background-sync: ", err);
	})
}

self.addEventListener('fetch', event => {
	let requestUrl = new URL(event.request.url);

	if (!isTestRequest(requestUrl) &&
		 !isGoogleMapsOrigin(requestUrl.origin)) {
		// cache local content - CACHE FIRST NETWORK FALLBACK
		if (isRestaurantReviewRequest(requestUrl.pathname)) {
			event.respondWith(serveReviewData(event.request));
		} else if (isRestaurantDataRequest(requestUrl.pathname)) {
			event.respondWith(serveRestaurantData(event.request));
		} else {
			event.respondWith(serveCachedData(event.request));
		}
	}
});


/**
 * Strategy for dynamic data (review-info from node-server)
 */
serveReviewData = (request) => {
	return updateReviewsFromNetwork(request);
}

/**
 * Strategy for dynamic data (restaurant-info from node-server)
 */
serveRestaurantData = (request) => {
	return readAllData(RESTAURANT_STORE)
	.then(data => {
		if (data.length > 0) {
			var responseBlob = new Blob([JSON.stringify(data, null, 2)], {
				type: 'application/json'
			});
			var responseInit = { 'status': 200, 'statusText': 'restaurant data OK'};
			// try network-fetch to update idb
			updateRestaurantsFromNetwork(request)
			return new Response(responseBlob, responseInit);
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
							console.log("ERROR when requesting: ", request);
							console.log("[ServiceWorker] ERROR while caching dynamic files: ", err);
						}
					});
			});
	})
}

/**
 * Retrieves Restraurant-Reviews from network and updated IndexedDB with it
 */
updateReviewsFromNetwork = (request) => {
	let request_id = parseInt(request.url.substr(request.url.indexOf('=') + 1, request.url.length));
	let clonedResponse = null;
	return fetch(request)
	.then(res => {
		clonedResponse = res.clone();
		return res.json();
	})
	.then(data => {
		data.sort(compareReview);
		return writeData(REVIEW_STORE, {id: request_id, reviews: data})
	})
	.then(() => {
		return clonedResponse;
	})
}

/**
 * Retrieves Restraurant-info from network and updated IndexedDB with it
 */
updateRestaurantsFromNetwork = (request) => {
	return fetch(request)
		.then(response => {
			let clonedRes = response.clone();
			clearAllData(RESTAURANT_STORE)
				.then(() => {
					return clonedRes.json();
				})
				.then(data => {
					for (let key in data) {
						let current = data[key];
						writeData(RESTAURANT_STORE, current);
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
 * Determines if requested resource is for testing purposes
 */
isTestRequest = (request) => {
	return request.pathname === '/test';
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
isRestaurantDataRequest = (pathname) => {
	return pathname === "/restaurants";
}

/**
 * Determines if requested resource is restaurant-info from node-server
 */
isRestaurantReviewRequest = (pathname) => {
	return pathname === "/reviews/";
}
