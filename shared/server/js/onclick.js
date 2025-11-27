
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
		menu.style.display = "none";
		return;
	}

	pos = getPointerPos(e);

	// show the menu and position it next to the pointer
	menu.style.top = pos.pointerY + "px";
	menu.style.left = pos.pointerX + "px";
	menu.style.display = "inline-block";

	clicking = false;
}

