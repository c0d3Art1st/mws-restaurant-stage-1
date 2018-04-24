let dbPromise = idb.open("pwagram", 1, (db) => {
   if (!db.objectStoreNames.contains('posts'))
      db.createObjectStore('restaurants', {
         keyPath: 'id'
      });
});

function writeData(storeName, data) {
   return dbPromise
   .then(db => {
      let tx = db.transaction(storeName, 'readwrite');
      let store = tx.objectStore(storeName);
      store.put(data);
      return tx.complete;
   });
}

function readAllData(storeName) {
   return dbPromise
   .then(db => {
      let tx = db.transaction(storeName);
      let store = tx.objectStore(storeName);
      return store.getAll();
   });
};

function clearAllData(storeName) {
   return dbPromise
   .then(db => {
      let tx = db.transaction(storeName, 'readwrite');
      let store = tx.objectStore(storeName);
      store.clear();
      return tx.complete;
   })
}

function deleteItem(storeName, ItemId) {
   return dbPromise
   .then(db => {
      let tx = db.transaction(storeName, 'readwrite');
      let store = tx.objectStore(storeName);
      store.delete(ItemId);
   });
}
