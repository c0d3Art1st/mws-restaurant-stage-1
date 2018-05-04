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
