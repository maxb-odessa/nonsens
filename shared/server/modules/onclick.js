
function getPointerPos(e) {
	return {
		pointerX: e.clientX,
		pointerY: e.clientY
	};
}

// show/hide main menu
function toggleMenu(e) {

	// find the menu elem corresponding to target class (menu elem id == its class name)
	var menu;
	var classes = e.target.className.split(' ');

	for (let i = 0; i < classes.length; i++) {
		menu = document.getElementById(classes[i] + "-menu");
		if (menu !== null) {
			break;
		}
	}

	if (menu === null) {
		return;
	}


	// hide the menu
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

export { toggleMenu, showMenu };
