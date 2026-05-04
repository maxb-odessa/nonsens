
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
	var top = pos.pointerY * 1;
	var left = pos.pointerX * 1;

	// display the menu first at 0:0 position for its dimension to be calculated
	menu.style.top = 0;
	menu.style.left = 0;
	menu.style.display = "inline-block";

	// keep the menu within viewport
	if (menu.clientWidth + left > document.documentElement.clientWidth) {
		left = document.documentElement.clientWidth - menu.clientWidth;
	}

	if (menu.clientHeight + top > document.documentElement.clientHeight) {
		top = document.documentElement.clientHeight - menu.clientHeight;
	}

	menu.style.top = top + "px";
	menu.style.left = left + "px";

}

window.toggleMenu = toggleMenu;
window.showMenu = showMenu;

