let snackbar = document.querySelector("#snackbar");
let snackbarId = null;

/*
 * Displays message in snackbar for 3 Seconds
 */
function showSnackbar(message) {
	if (snackbarId !== null) {
		clearTimeout(snackbarId);
	}
	snackbar.textContent = message;
	snackbar.classList.add("visible");
	snackbarId = setTimeout(() => {
		snackbar.textContent = "";
		snackbar.classList.remove("visible");
	}, 4000)
}

function toggleFavoriteButton(e, isFavorite) {
	if (isFavorite === "true") {
		e.target.classList.remove("favorite");
		e.target.classList.add("not-favorite");
	} else {
		e.target.classList.remove("not-favorite");
		e.target.classList.add("favorite");
	}
}
