
function getPointerPos(e) {
	return {
		pointerX: e.clientX,
		pointerY: e.clientY
	};
}

// show/hide main menu
// get menu id from 'data-menu' attribute if present
function toggleMenu(e) {

	var menuId = e.target.getAttribute("data-menu");

	if (! menuId) {
		return;
	}

	var menu = document.getElementById(menuId);
	if (! menu) {
		return;
	}

	// hide the menu?
	if (menu.style.display && menu.style.display !== "none") {
		showMenu(e, menu.id, false);
		return;
	}

	showMenu(e, menu.id, true);
}

function showMenu(e, id, doShow) {
	var menu = document.getElementById(id);

	if (! doShow) {
		menu.style.display = "none";
		return;
	}

	let pos = getPointerPos(e);

	// show the menu and position it next to the pointer
	menu.style.top = (pos.pointerY - 20) * 1 + "px";
	menu.style.left = (pos.pointerX - 20) * 1 + "px";
	menu.style.display = "inline-block";
}

window.toggleMenu = toggleMenu;
window.showMenu = showMenu;

