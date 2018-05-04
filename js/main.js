let restaurants,
   neighborhoods,
   cuisines
var map;
var markers = [];
let loadMapButton;
let isMapLoaded = false;
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 * Sets up load-map button
 */
document.addEventListener('DOMContentLoaded', (event) => {
   fetchNeighborhoods();
   fetchCuisines();
   updateRestaurants();   // workaround: cardviews are loaded even if request to G-maps failes

	loadMapButton = document.querySelector("#load-map-button");
	loadMapButton.onclick = (event) => {
		loadMap();
	};
});

/*
 * Loads live version of google-maps, creates/hides corresponding info messages
 */
loadMap = () => {
	loadMapButton.style.display = "none";
	let script = document.createElement("script");
	script.setAttribute("src", "https://maps.googleapis.com/maps/api/js?key=AIzaSyDMcC5Kw5Yn29DvQ2YOlL1sYyLScjDvuKI&libraries=places&callback=initMap");
	document.body.appendChild(script);
	setTimeout(displayMapNotAvailable, 1750);
	isMapLoaded = true;
}

/*
 * Callback used by Dropdown's onchange-event
 */
update = () => {
	if(!isMapLoaded) {
		loadMap();
	}
	updateRestaurants(); // formerly directly used by Dropdown's onchange
}

/*
 * Displays 'Map not available offline'-message after certain amount off ms
 */
displayMapNotAvailable = () => {
	document.querySelector("#map-not-available").style.display = "block";
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
   DBHelper.fetchNeighborhoods((error, neighborhoods) => {
      if (error) { // Got an error
         console.error(error);
      } else {
         self.neighborhoods = neighborhoods;
         fillNeighborhoodsHTML();
      }
   });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
   const select = document.getElementById('neighborhoods-select');
   neighborhoods.forEach(neighborhood => {
      const option = document.createElement('option');
      option.innerHTML = neighborhood;
      option.value = neighborhood;
      select.append(option);
   });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
   DBHelper.fetchCuisines((error, cuisines) => {
      if (error) { // Got an error!
         console.error(error);
      } else {
         self.cuisines = cuisines;
         fillCuisinesHTML();
      }
   });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
   const select = document.getElementById('cuisines-select');

   cuisines.forEach(cuisine => {
      const option = document.createElement('option');
      option.innerHTML = cuisine;
      option.value = cuisine;
      select.append(option);
   });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
   let loc = {
      lat: 40.722216,
      lng: -73.987501
   };
   try {
      self.map = new google.maps.Map(document.getElementById('map'), {
         zoom: 12,
         center: loc,
         scrollwheel: false
      });
   }
   catch(Error) {
      Console.log("[Main.js] ERROR while getting Google Map");
   }
   updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
   const cSelect = document.getElementById('cuisines-select');
   const nSelect = document.getElementById('neighborhoods-select');

   const cIndex = cSelect.selectedIndex;
   const nIndex = nSelect.selectedIndex;

   const cuisine = cSelect[cIndex].value;
   const neighborhood = nSelect[nIndex].value;

   DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
      if (error) { // Got an error!
         console.error("[DBHelper] Error while fetching Data: ",error);
      } else {
         resetRestaurants(restaurants);
         fillRestaurantsHTML();
      }
   })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
   // Remove all restaurants
   self.restaurants = [];
   const ul = document.getElementById('restaurants-list');
   ul.innerHTML = '';

   // Remove all map markers
   self.markers.forEach(m => m.setMap(null));
   self.markers = [];
   self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
   const ul = document.getElementById('restaurants-list');
   restaurants.forEach(restaurant => {
      ul.append(createRestaurantHTML(restaurant));
   });

   if(restaurants.length === 0) {
      ul.append(createEmptyMessage());
   }
   addMarkersToMap();
}

/**
 * Creates a message if no restaurants are availble for the selected
 * neihborhood/cuisine-combination
 */
createEmptyMessage = () => {
   const li = document.createElement("li");
   li.style.width = "100%";
   const emptyMessage = document.createElement("p");
   emptyMessage.innerHTML = "No restaurants available. Please try a different area or type of cuisine.";
   li.append(emptyMessage);
   return li;
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
   const li = document.createElement('li');
   const card = document.createElement('article');
   card.setAttribute("aria-label", restaurant.name);

   const picture = document.createElement('picture');
   const source = document.createElement('source');
   const imageName = DBHelper.imageUrlForRestaurant(restaurant);
   source.className = 'restaurant-img';
   source.setAttribute("srcset", createWebpSourceSet(imageName))
   source.setAttribute("sizes", createImageSizes());
   source.setAttribute("type", "image/webp");

   picture.append(source);

   const image = document.createElement('img');
   image.className = 'restaurant-img';
   image.src = imageName
   image.setAttribute("srcset", createJpegSourceSet(imageName));
   image.setAttribute("sizes", createImageSizes());
   image.setAttribute("alt", restaurant.name);
   picture.append(image);
   card.append(picture);

   const infoBody = document.createElement('div');

   const name = document.createElement('h1');
   name.innerHTML = restaurant.name;
   infoBody.append(name);

   const neighborhood = document.createElement('p');
   neighborhood.innerHTML = restaurant.neighborhood;
   infoBody.append(neighborhood);

   const address = document.createElement('p');
   address.innerHTML = restaurant.address;
   infoBody.append(address);

   const more = document.createElement('a');
   more.innerHTML = 'View Details';
   more.href = DBHelper.urlForRestaurant(restaurant);
   more.setAttribute("role", "button");
   more.setAttribute("aria-label", `${restaurant.name} - View Details`);

   card.append(infoBody);
   card.append(more)
   li.append(card);

	const favorite = document.createElement('button');
	favorite.classList.add("not-favorite");
	favorite.classList.add("favoriteButton");
	favorite.innerHTML = "Favorite";
	li.append(favorite);
   return li;
}

/**
 * Creates content for jpeg srcset
 */
createJpegSourceSet = (imageName) => {
	if (imageName.search("undefined") != -1) {
		imageName = imageName.replace("undefined", "no_image");
	}
   return `${imageName}_400.jpg 400w, ${imageName}_600.jpg 600w, ${imageName}_800.jpg 800w`;
}

/**
 * Creates content for webp srcset
 */
createWebpSourceSet = (imageName) => {
	if (imageName.search("undefined") != -1) {
		imageName = imageName.replace("undefined", "no_image");
	}
   return `${imageName}_400.webp 400w, ${imageName}_600.webp 600w, ${imageName}_800.webp 800w`;
}

/**
 * Create responsive sizes for images
 */
createImageSizes = () => {
   return "(max-width: 590px) 100vw," +
          "(max-width: 800px) 50vw, " +
          "35vw";
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
   restaurants.forEach(restaurant => {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
      google.maps.event.addListener(marker, 'click', () => {
         window.location.href = marker.url
      });
      self.markers.push(marker);
   });
}
