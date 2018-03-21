if ("serviceWorker" in navigator) {
   navigator.serviceWorker.register("/sw.js").then(reg =>{
      console.log("[App.js] Successfully registered SW");
   })
   .catch(err => {
      console.log("[App.js] Error registering SW");
   });
}
