if ("serviceWorker" in navigator) {
   navigator.serviceWorker.register("/sw.js").then(reg =>{
      console.log("[ServiceWorker] Successfully registered SW");
   })
   .catch(err => {
      console.log("[ServiceWorker] Error registering SW");
   });
}
