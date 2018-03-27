let restaurant;
var map;

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
});


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
         fillRestaurantHTML();
         callback(null, restaurant)
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
   image.setAttribute("alt", restaurant.photograph_alt);
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
}

/**
* Initializes info container in restaurant.html
*/
initInfoContainer = () => {
   document.querySelector("#info-container").innerHTML =
   "<section id='restaurant-container'>" +
      "<h2 id='restaurant-name'></h2>"+
      "<div id='restaurant-img-area'>" +
         "<picture id='restaurant-picture'></picture><!--" +
      "--><p id='restaurant-cuisine'></p>" +
      "</div>" +
      "<div id='restaurant-info-area'>" +
         "<p id='restaurant-address'></p>" +
         "<table id='restaurant-hours'></table>" +
      "</div>" +
   "</section>" +
   "<section id='reviews-container'>" +
      "<ul id='reviews-list'></ul>" +
   "</section>";
};

/**
 * Creates content for jpeg srcset
 */
createJpegSourceSet = (image) => {
   let imageName = image.substr(0, image.indexOf('.'));
   return `${imageName}_400.jpg 400w, ${imageName}_600.jpg 600w, ${imageName}_800.jpg 800w`;
}

/**
 * Creates content for webp srcset
 */
createWebpSourceSet = (image) => {
   let imageName = image.substr(0, image.indexOf('.'));
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
   container.appendChild(title);

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
   li.classList.add("review");

   const reviewHeader = document.createElement("div");
   reviewHeader.classList.add("review-header");

   const name = document.createElement('p');
   name.innerHTML = review.name;
   reviewHeader.appendChild(name);

   const date = document.createElement('p');
   date.classList.add("review-date");
   date.innerHTML = review.date;
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
   const breadcrumb = document.getElementById('breadcrumb');
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
