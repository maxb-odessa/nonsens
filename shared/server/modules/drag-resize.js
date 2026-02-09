
function dragElement(ev) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	var target = ev.target;

	var targetStyle = window.getComputedStyle(target, null);

	// is this element movable?
	if (targetStyle.cursor != "move") {
		return;
	}
	var parent = target.parentNode;
	var container = parent.parentNode;

	var oldPos = getPos(ev);
	pos3 = oldPos.X;
	pos4 = oldPos.Y;

	// get parent size
	var parentStyle = window.getComputedStyle(parent, null);
	var parentSize = {
		Width: parentStyle.width.match(/\d+/)[0] * 1.0,
		Height: parentStyle.height.match(/\d+/)[0] * 1.0,
	};

	// get top level container position and dimension
	var containerStyle = window.getComputedStyle(container, null);

	var containerDim = {
		Top:	containerStyle.top.match(/\d+/)[0] * 1.0,
		Left:	containerStyle.left.match(/\d+/)[0] * 1.0,
		Width:	containerStyle.width.match(/\d+/)[0] * 1.0,
		Height:	containerStyle.height.match(/\d+/)[0] * 1.0,
	};

	document.onmousemove = elementDrag;
	document.ontouchmove = elementDrag;

	document.onmouseup = endDrag;
	document.ontouchend = endDrag;

	target.dragging = true;

	function getPos(e) {
		let clientX, clientY;

		// mouse or touchpad?
		if (e.clientX) {
			clientX = e.clientX;
			clientY = e.clientY;
		} else {
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		}

		return {X: clientX * 1.0, Y: clientY * 1.0};
	}

	function elementDrag(e) {

		e.preventDefault();

		if (! target.dragging) {
			return;
		}


		// calculate the new cursor position:
		let pos = getPos(e);
		pos1 = pos3 - pos.X;
		pos2 = pos4 - pos.Y;
		pos3 = pos.X;
		pos4 = pos.Y;

		// set the element's new position, obey top container position and size
		let newTop = parent.offsetTop - pos2;
		let newLeft = parent.offsetLeft - pos1;

		if (newTop <= containerDim.Top) {
			newTop = containerDim.Top;
		}

		if (newLeft <= containerDim.Left) {
			newLeft = containerDim.Left;
		}

		if (newTop + parentSize.Height >= containerDim.Height) {
			newTop = containerDim.Height - parentSize.Height - 1;
		}

		if (newLeft + parentSize.Width >= containerDim.Width) {
			newLeft = containerDim.Width - parentSize.Width - 1;
		}

		// set new and adjusted target's parent position
		parent.style.top = newTop + "px";
		parent.style.left = newLeft + "px";
	}

	function endDrag() {
		// position target with cqw/cqh instead of px
		let newStyle = window.getComputedStyle(parent, null);
// move to func
		parent.style.top = Math.round(newStyle.top.match(/\d+/)[0]  / containerDim.Height * 100.0) + "cqh";
		parent.style.left = Math.round(newStyle.left.match(/\d+/)[0] / containerDim.Width * 100.0) + "cqw";

		parent.style.height = Math.round(newStyle.height.match(/\d+/)[0] / containerDim.Height * 100.0) + "cqh";
		parent.style.width = Math.round(newStyle.width.match(/\d+/)[0] / containerDim.Width * 100.0) + "cqw";

		target.dragging = false;

		document.onmouseup = null;
		document.onmousemove = null;
	}

}

//function px2cq()... // TODO

document.onmousedown = dragElement;
document.ontouchstart = dragElement;
