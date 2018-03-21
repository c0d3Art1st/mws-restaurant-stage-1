let self = this;
const STATIC_CACHE_VERSION = 1;

let staticFiles = [
   "/",
   "/index.html",
   "/css/styles.css",
   "/js/app.js",
   "/js/dbhelper.js",
   "/js/main.js",
   "/js/restaurant_info.js"
];

self.addEventListener('install', event => {
   console.log("[ServiceWorker] Successfully installed SW")
   event.waitUntil(
      caches.open('static-v' + STATIC_CACHE_VERSION)
      .then(cache => {
         console.log("[ServiceWorker] Caching static files");
         return cache.addAll(staticFiles);
      })
      .catch(err => {
         console.log("#ERROR# [ServiceWorker] Error while caching static files: ", err);
      })
   );
});
