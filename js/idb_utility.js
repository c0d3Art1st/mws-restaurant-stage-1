const RESTAURANT_STORE = "restaurant_store";
const REVIEW_STORE = "review_store"
const FAVORITE_SYNC_STORE = "favorite_sync_store";
const REVIEW_SYNC_STORE = "review_sync_store";

let dbPromise = idb.open("restaurant_review_(stage_3)", 1, (db) => {
   if (!db.objectStoreNames.contains(RESTAURANT_STORE))
      db.createObjectStore(RESTAURANT_STORE, {
         keyPath: 'id'
      });
	if (!db.objectStoreNames.contains(REVIEW_STORE))
      db.createObjectStore(REVIEW_STORE, {
	      keyPath: 'id'
	   });
	if (!db.objectStoreNames.contains(FAVORITE_SYNC_STORE))
	   db.createObjectStore(FAVORITE_SYNC_STORE, {
	      keyPath: 'id'
	   });
	if (!db.objectStoreNames.contains(REVIEW_SYNC_STORE))
	   db.createObjectStore(REVIEW_SYNC_STORE, {
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
