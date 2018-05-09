let restaurant;
var map;
let loadMapButton;
let reviewButton;
let reviewDlg;
let usernameTextBox = null;
let ratingTextBox = null;
let commentTextBox = null;
let reviewSyncId = 1;
let reviewDataRecevied = false;
let focusedElementbeforeModal;

/**
 * Fill Breadcrumb in offline mode, when G-maps is not available
 */
document.addEventListener('DOMContentLoaded', (event) => {
   fetchRestaurantFromURL((error, restaurant) => {
      if (error) { // Got an error!
         console.error("[Restaurant_Info] ERROR while fetching Restaurant: ", error);
      } else {
         fillBreadcrumb();
      }
   });
	loadMapButton = document.querySelector("#load-map-button");
	loadMapButton.onclick = (event) => {
		loadMap()
	};
	loadMapButton.onkeyup = (event) => {
		if(event.keyCode == 13)
			loadMap();
	};

	reviewDlg = document.querySelector("#review-dlg");
	reviewButton = document.querySelector('#add-review-fab');
	reviewButton.onclick = initReviewDialog;


	document.querySelector(".send-button").onclick = () => {
		let review = {
			restaurant_id : self.restaurant.id,
			name: usernameTextBox.value,
			rating: ratingTextBox.value,
			comments: commentTextBox.value,
			createdAt: new Date().getTime()
		}

		if (usernameTextBox.value !== "" &&
			 ratingTextBox.value !== "" &&
			 commentTextBox.value !== "") {
			addReview(review);
			closeReviewDlg();
		}
		else {
			showSnackbar("Review not sent. Please provide username, rating & comment!");
		}
	}
});

function closeReviewDlg() {
	reviewDlg.classList.remove("visible");
	focusedElementbeforeModal.focus();
}

function initReviewDialog() {
	if (usernameTextBox == null || ratingTextBox == null | commentTextBox == null) {
		usernameTextBox = document.querySelector('#username');
		ratingTextBox = document.querySelector("#rating");
		commentTextBox = document.querySelector("#review");
	}
	document.querySelector("#review-restaurant-name").innerHTML=self.restaurant.name;
	usernameTextBox.value = "";
	ratingTextBox.value = "";
	commentTextBox.value = "";

	focusedElementbeforeModal = document.activeElement;
	reviewDlg.addEventListener("keydown", trapTabKey);
	document.querySelectorAll(".cancel-button").forEach((but) => {
		but.onclick = closeReviewDlg;
	})

	var focusableElementsString = 'a[href], area[href], input, select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
	var focusableElements = reviewDlg.querySelectorAll(focusableElementsString);
	focusableElements = Array.prototype.slice.call(focusableElements);
	var firstTabStop = focusableElements[0];
	var lastTabStop = focusableElements[focusableElements.length - 1];

	reviewDlg.classList.add("visible");
	firstTabStop.focus();

	function trapTabKey(e) {
		// Check for TAB key press
		if (e.keyCode === 9) {
			// SHIFT + TAB = backwards movement
			if (e.shiftKey) {
				if(document.activeElement === firstTabStop) {
					e.preventDefault();
					lastTabStop.focus();
				}
			// TAB = forwards movement
			} else {
				if(document.activeElement === lastTabStop) {
					e.preventDefault();
					firstTabStop.focus();
				}
			}
		}
		// ESCAPE = close modal
		if (e.keyCode === 27) {
			closeReviewDlg();
		}
	}
}

function addReview(review) {
	// add review to gui
	document.querySelector("#reviews-list").prepend(createReviewHTML(review));

	// check for background Syncing
	if ('serviceWorker' in navigator && 'SyncManager' in window) {
	 navigator.serviceWorker.ready.then((sw) => {

		 // update cached version of restaurant
		 let restaurant = self.restaurant;
		 readData(REVIEW_STORE, self.restaurant.id)
		 .then(result => {
			 // restaurant = result;

			 let tmp = {};
			 readData(REVIEW_STORE, restaurant.id)
			 .then(res => {
				 tmp = res;
				 if (tmp.reviews == undefined)
			   	 tmp.reviews = [];
				 tmp.reviews.push(review);
				 return deleteItem(REVIEW_STORE, restaurant.id);
			 })
			 .then(res => {
				 writeData(REVIEW_STORE, tmp);
			 });
			 console.log("writing sync request");
			 writeData(REVIEW_SYNC_STORE, {id: reviewSyncId, review: review})
			 .then(() => {
				 reviewSyncId++;
				 sw.sync.register('sync-new-review');
			 })
			 .then(() => {
				 DBHelper.isDbReachable()
				 .then(() => {
						 showSnackbar(`Review added for '${restaurant.name}''`);
				 })
				 .catch(error => {
					 showSnackbar("Offline: Request stored for syncing!");
				 });
			 });
		 });
		 // create sync-task and register it
	 });
	}
}

/*
 * Loads live version of google-maps, creates/hides corresponding info messages
 */
loadMap = () => {
	loadMapButton.style.display = "none";
	let script = document.createElement("script");
	script.setAttribute("src", "https://maps.googleapis.com/maps/api/js?key=AIzaSyDMcC5Kw5Yn29DvQ2YOlL1sYyLScjDvuKI&libraries=places&callback=initMap");
	document.body.appendChild(script);
	setTimeout(displayMapNotAvailable, 1750);
}

/*
 * Displays 'Map not available offline'-message after certain amount off ms
 */
displayMapNotAvailable = () => {
	document.querySelector("#map-not-available").style.display = "block";
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
   fetchRestaurantFromURL((error, restaurant) => {
      if (error) { // Got an error!
         console.error("[Restaurant_Info] ERROR while fetching Restaurant: ", error);
      } else {
         self.map = new google.maps.Map(document.getElementById('map'), {
            zoom: 16,
            center: restaurant.latlng,
            scrollwheel: false
         });
         fillBreadcrumb();
         DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      }
   });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
   if (self.restaurant) { // restaurant already fetched!
      callback(null, self.restaurant)
      return;
   }
   const id = getParameterByName('id');
   if (!id) { // no id found in URL
      error = 'No restaurant id in URL'
      callback(error, null);
   } else {
      DBHelper.fetchRestaurantById(id, (error, restaurant) => {
         self.restaurant = restaurant;
         if (!restaurant) {
            console.error(error);
            return;
         }

			reviewDataRecevied = false;
			// get reviews from network
			fetch(`http://localhost:1337/reviews/?restaurant_id=${self.restaurant.id}`)
			.then(res => {
				return res.json();
			})
			.then(review_data => {
				reviewDataRecevied = true;
				review_data.sort(compareReview);
				self.restaurant.reviews = review_data;
				console.log("FROM WEB: ", self.restaurant.reviews);

				fillRestaurantHTML();
	         callback(null, restaurant)
			})
			.catch(error => {
	 		  console.log("[DbHelper.js] ERROR while fetching reviews...", error);
		  });
        //
			// get reviews from idb
			console.log("ID: ", self.restaurant.id);
			readData(REVIEW_STORE, self.restaurant.id)
			.then(data => {
				if (data !== undefined) {
					console.log("FROM CACHE: ", data);
					data.reviews.sort(compareReview);
					self.restaurant.reviews = data.reviews;

					if(!reviewDataRecevied) {
						fillRestaurantHTML();
		         	callback(null, restaurant)
					}
				}
			})
			.catch(error => {
				console.log("[ServiceWorker] ERROR while fetching idb-data: ", error);
			})
      });
   }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
   initInfoContainer();
   const name = document.getElementById('restaurant-name');
   name.innerHTML = restaurant.name;
   name.setAttribute("aria-label", `${restaurant.name} - info section`)

   const picture = document.getElementById('restaurant-picture');
   const source = document.createElement('source');
   const imageName = DBHelper.imageUrlForRestaurant(restaurant);

   source.setAttribute("srcset", createWebpSourceSet(imageName))
   source.className = 'restaurant-img';
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

   const cuisine = document.getElementById('restaurant-cuisine');
   cuisine.innerHTML = restaurant.cuisine_type;

   const address = document.getElementById('restaurant-address');
   address.innerHTML = restaurant.address;

   // fill operating hours
   if (restaurant.operating_hours) {
      fillRestaurantHoursHTML();
   }
   // fill reviews
   fillReviewsHTML();

	// add favorite button
	const favorite = document.createElement('button');
	let favoriteClass = (restaurant.is_favorite === "true") ? "favorite" : "not-favorite";
	favorite.classList.add(favoriteClass);
	favorite.classList.add("favoriteButton");
	favorite.setAttribute("aria-label", `Mark as favorite`);
	favorite.innerHTML = "Favorite";
	favorite.onclick= (e) => { DBHelper.toggleFavorite(e,restaurant);};

	document.querySelector("#restaurant-img-area").append(favorite);
}

/**
* Initializes info container in restaurant.html
*/
initInfoContainer = () => {
   document.querySelector("#info-container").innerHTML =
   "<section tabindex='0' id='restaurant-container'>" +
      "<h2 id='restaurant-name'></h2>"+
      "<div id='restaurant-img-area'>" +
         "<picture id='restaurant-picture'></picture><!--" +
      "--><p id='restaurant-cuisine'></p>" +
      "</div>" +
      "<div id='restaurant-info-area'>" +
         "<p id='restaurant-address' tabindex='0'></p>" +
         "<table id='restaurant-hours' tabindex='0'></table>" +
      "</div>" +
   "</section>" +
   "<section id='reviews-container' tabindex='0'>" +
      "<ul id='reviews-list'></ul>" +
   "</section>";
};

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
          "(max-width: 1200px) 50vw, " +
          "25vw";
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
   const hours = document.getElementById('restaurant-hours');
   for (let key in operatingHours) {
      const row = document.createElement('tr');

      const day = document.createElement('td');
      day.classList.add("week-day");
      day.innerHTML = key;
      row.appendChild(day);

      const time = document.createElement('td');
      time.innerHTML = processMultilineHours(operatingHours[key]);
      row.appendChild(time);

      hours.appendChild(row);
   }
}

/**
 *  Create hours-string with line-break, if two hour-time-spans exist per day
 */
processMultilineHours = (hours) => {
   let hoursString  = "";
   let openingHoursDivider = hours.indexOf(',');
   if (openingHoursDivider !== -1) {
      hoursString += hours.substr(0, openingHoursDivider) + "<br>";
      hoursString += hours.substr(openingHoursDivider + 2);
   } else {
      hoursString = "\t" + hours;
   }
   return hoursString;
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
   const container = document.getElementById('reviews-container');
   const title = document.createElement('h2');
   title.innerHTML = 'Reviews';
   title.setAttribute("aria-label", `Reviews for restaurant ${self.restaurant.name}`)
   container.prepend(title);

	const reviewButton = document.createElement("button");
	reviewButton.setAttribute("id", "add-review-button");
	// reviewButton.setAttribute("role", "button");
	reviewButton.setAttribute("tabindex", "0");
	reviewButton.innerHTML = "add review";
	reviewButton.onclick = initReviewDialog;
	container.appendChild(reviewButton);

   if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
   }
   const ul = document.getElementById('reviews-list');
   reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
   });
   container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
   const li = document.createElement('li');
   li.setAttribute("tabindex", "0");
   li.classList.add("review");

   const reviewHeader = document.createElement("div");
   reviewHeader.classList.add("review-header");

   const name = document.createElement('p');
   name.innerHTML = review.name;
   reviewHeader.appendChild(name);

   const date = document.createElement('p');
   date.classList.add("review-date");


	const monthNames = [
		 "January", "February", "March",
		 "April", "May", "June", "July",
		 "August", "September", "October",
		 "November", "December"
	  ];
	let createdAt = new Date(review.createdAt)
   date.innerHTML = `${monthNames[createdAt.getMonth()]} ${createdAt.getDate()}, ${createdAt.getFullYear()}`;
	// date.innerHTML = review.createdAt;

	reviewHeader.appendChild(date);

   li.appendChild(reviewHeader);

   const reviewBody = document.createElement("div");
   reviewBody.classList.add("review-body");

   const rating = document.createElement('p');
   rating.classList.add("review-rating");
   rating.innerHTML = `Rating: ${review.rating}`;
   reviewBody.appendChild(rating);

   const comments = document.createElement('p');
   comments.innerHTML = review.comments;
   reviewBody.appendChild(comments);

   li.appendChild(reviewBody);

   return li;
}


/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
   const breadcrumb = document.querySelector('#breadcrumb ol');
   breadcrumb.innerHTML="<li><a href='/'>Home</a></li>";
   const li = document.createElement('li');
   const a = document.createElement('a');
   a.setAttribute("href", "/restaurant.html?id=" + restaurant.id);
   a.setAttribute("aria-current", "page");
   a.text = restaurant.name;
   li.append(a);
   breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
   if (!url)
      url = window.location.href;
   name = name.replace(/[\[\]]/g, '\\$&');
   const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
      results = regex.exec(url);
   if (!results)
      return null;
   if (!results[2])
      return '';
   return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
