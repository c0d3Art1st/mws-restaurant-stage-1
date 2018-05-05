/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
		return fetch(DBHelper.DATABASE_URL)
	 	.then((response) => {
			 return response.json();
		})
		.then(data => {
			const restaurants = data;
			callback(null, restaurants);
		})
		.catch(error => {
			callback(`Request failed. Returned status of ${error}`, null);
		});
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  static isDbReachable() {
	  return fetch("http://localhost:1337/test", {
	  });
  }

  /**
   * Toggle favorite state of restaurant
   */
  static toggleFavorite(event, restaurant_src) {
  	if ('serviceWorker' in navigator && 'SyncManager' in window) {
  		navigator.serviceWorker.ready.then((sw) => {
  		let restaurant = {};
  		// get updated version of bound restaurant from cache
  		readData(IDB_NAME, restaurant_src.id)
  		.then((result) => {
  			restaurant = result;
  			// toggle button appearance
  			toggleFavoriteButton(event, restaurant.is_favorite);

			// update currently cached info of restaurant
			let tmp = {};
			readData(IDB_NAME, restaurant.id)
			.then(res => {
				tmp = res;
				tmp.is_favorite = (restaurant.is_favorite === "true") ? "false" : "true";
				return deleteItem(IDB_NAME, restaurant.id);
			})
			.then(res => {
				writeData(IDB_NAME, tmp);
			});

  			// write sync-task to idb
  			writeData(FAVORITE_SYNC_STORE, {id: restaurant.id, is_favorite: restaurant.is_favorite})
  				.then(() => {
  				// register sync-task in service worker and give it a TAG // so we can access it in the sw-code later
  					sw.sync.register('sync-new-favorite');
  				})
  				.then(() => {
  					DBHelper.isDbReachable()
  					.then(() => {
  						if (restaurant.is_favorite === "true") {
  							showSnackbar(`'${restaurant.name}' removed from favorites!`);
  						}
  						else {
  							showSnackbar(`'${restaurant.name}' added to favorites!`);
  						}
  					})
  					.catch(error => {
  						showSnackbar("Offline: Request stored for syncing!");
  					});
  				});
  			  });
  		  });
  	}
  	else {
  	// provide fallback for browsers that don't support the SyncManager // Just send the data via fetch-API!
  	}
 }
}
