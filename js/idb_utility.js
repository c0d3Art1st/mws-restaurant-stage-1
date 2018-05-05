const IDB_NAME = "restaurants";
const FAVORITE_SYNC_STORE = "favorite_sync";

let dbPromise = idb.open("restaurant_review_(stage_2)", 1, (db) => {
   if (!db.objectStoreNames.contains(IDB_NAME))
      db.createObjectStore(IDB_NAME, {
         keyPath: 'id'
      });
	if (!db.objectStoreNames.contains(FAVORITE_SYNC_STORE))
	   db.createObjectStore(FAVORITE_SYNC_STORE, {
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

function readData(storeName, key) {
	return dbPromise
	.then(db => {
		let tx = db.transaction(storeName);
		let store = tx.objectStore(storeName);
		return store.get(key);
	});
}

function getStoreCount(storeName) {
	return dbPromise
	.then(db => {
		let tx = db.transaction(storeName);
		let store = tx.objectStore(storeName);
		return store.count();
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
