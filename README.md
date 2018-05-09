# Restaurant Reviews(Stage 3)

**Restaurant Reviews** is a three-stage course material project and part of [Udacity](https://www.udacity.com/)'s new [Mobile Web Specialist](https://www.udacity.com/course/mobile-web-specialist-nanodegree--nd024) Nanodegree. It is a simple Google Maps-like web-app that offers the user reviews and information about restaurants in New York. It has been implemented with a mobile-first approach that uses responsiveness and caching to make the web-app feel and display well on a range of devices with different screen sizes.

---
### Project Overview: Stage 3

For stage 3 of the **Restaurant Reviews** projects, the conversion of a static webpage to a mobile ready web application has to be driven even further. Users shall be enabled to favor and submit a review for a Restaurant. All this needs to be functional online and offline via background-syncing. Additionally a score of 90%+ on Progressive Web Apps, A11y & Performance must be achieved in Google Lighthouse.



### Usage

1. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer.
In a terminal, check the version of Python you have: `python -V`.
If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`.
If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

2. Download the [Node-Server](https://github.com/udacity/mws-restaurant-stage-2) Part of this exercise and follow the instruction in it's README-file

3. With your servers running, visit the site: `http://localhost:8000`, and look around for a bit to see what the current experience looks like.

4. To authentically test the background-syncing, testers have to go offline in Google Dev Tools AS WELL AS shutting down the internet-connection on their test-device for real, either per hardware or software. Otherwise the used background-sync API will not work as expected!



### Licence

**Restaurant Reviews** is released unser the [MIT Licence](https://opensource.org/licenses/MIT)
