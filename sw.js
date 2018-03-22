let self = this;
const STATIC_CACHE_NAME = "static-v1";
const DYN_CACHE_NAME = "dynamic-v1";
const FILE_LIMIT_DYN_CACHE = 50;

let staticFiles = [
   "/",
   "/index.html",
   "/offline.html",
   "/css/styles.css",
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
         console.log("#ERROR# [ServiceWorker] Error while caching static files: ", err);
      })
   );
});


self.addEventListener('fetch', event => {
   let requestUrl = new URL(event.request.url);

   if(!isGoogleOrigin(requestUrl.origin)) {
      // cache local content
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
               return caches.open(STATIC_CACHE_NAME)
               .then(cache => {
                  if (event.request.headers.get('accept').includes('text/html')) {
                     return cache.match('/offline.html');
                  } else {
                     console.log("#ERROR# [ServiceWorker] Error while caching dynamic files: ", err);
                  }
               });
            });
         })
      );
   }
});

trimCache = (cacheName, maxItems) => {
   caches.open(cacheName)
   .then(cache => {
      return cache.keys()
      .then(keys => {
         if(keys.length > maxItems) {
            cache.delete(keys[0])
            .then(trimCache(cacheName, maxItems));
         }
      });
   })
}


isGoogleOrigin = (origin) => {
   return origin.startsWith('https://maps.googleapis.com') ||
          origin.startsWith('https://maps.gstatic.com')  ||
          origin.startsWith('https://fonts.gstatic.com') ||
          origin.startsWith('https://fonts.googleapis.com');
}
