
// dispatch mouse events
function mouseEventHandler(ev) {
 	var target = ev.target;
	var targetStyle = window.getComputedStyle(target, null);

	// is this element movable? (set in CSS as 'cursor: move;')
	if (targetStyle.cursor == "move") {
		return dragElement(ev);
	}

	// is this element resizable? (has 'resizable' class);
	if (target.classList.contains("resizable")) {
		return resizeElement(ev);
	}
}


// get pure numbers of elem.Style size and pos
function getElemDim(st) {
	return {
		Top:	st.top.match(/-?\d+/)[0] * 1.0,
		Left:	st.left.match(/-?\d+/)[0] * 1.0,
		Width:	st.width.match(/-?\d+/)[0] * 1.0,
		Height:	st.height.match(/-?\d+/)[0] * 1.0,
	};
}

// drag element, naturally
function dragElement(ev) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	var target = ev.target;

	var parent = target.parentNode;
	var container = parent.parentNode;

	var oldPos = getPos(ev);
	pos3 = oldPos.X;
	pos4 = oldPos.Y;

	// get parent size
	var parentSize = parent.getBoundingClientRect();
	var parentStyle = window.getComputedStyle(parent, null);
	var parentDim = getElemDim(parentStyle);

	// calc half diff of parent size and parent rect box in case of parent was rotated
	parentDim.WDiff2 = Math.round((parentSize.width - parentDim.Width) / 2);
	parentDim.HDiff2 = Math.round((parentSize.height - parentDim.Height) / 2);

	// get top level container position and dimension
	var containerRect = container.getBoundingClientRect();
	var containerStyle = window.getComputedStyle(container, null);
	var containerDim = getElemDim(containerStyle);

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

		if (newTop <= containerDim.Top + parentDim.HDiff2) {
			newTop = containerDim.Top + parentDim.HDiff2;
		}

		//if (newLeft <= containerDim.Left) {
		if (newLeft <= containerDim.Left + parentDim.WDiff2) {
			newLeft = containerDim.Left + parentDim.WDiff2;
		}

		if (newTop + parentSize.height >= containerRect.height + parentDim.HDiff2) {
			newTop = containerDim.Height - parentSize.height + parentDim.HDiff2 - 1;
		}

		if (newLeft + parentSize.width >= containerDim.Width - parentDim.WDiff2) {
			newLeft = containerDim.Width - parentSize.width - parentDim.WDiff2 - 1;
		}

		// set new and adjusted target's parent position
		parent.style.top = newTop + "px";
		parent.style.left = newLeft + "px";
	}

	function endDrag() {
		// position target with cqw/cqh instead of px
		let newStyle = window.getComputedStyle(parent, null);
		let newDim = getElemDim(newStyle);

		parent.style.top = Math.round(newDim.Top  / containerRect.height * 100.0) + "cqh";
		parent.style.left = Math.round(newDim.Left / containerRect.width * 100.0) + "cqw";

		// just a translation from px to cq
		parent.style.height = Math.round(newDim.Height / containerRect.height * 100.0) + "cqh";
		parent.style.width = Math.round(newDim.Width / containerRect.width * 100.0) + "cqw";

		target.dragging = false;

		document.onmouseup = null;
		document.onmousemove = null;
	}
}


// the element was resized
function resizeElement(ev) {
	var target = ev.target;

	// resizing done, recalculate target size
	// convert elem size from px to cqh/cqw
	function resizingDone(e) {
		var targetStyle = window.getComputedStyle(target, null);
		var targetDim = getElemDim(targetStyle);

		var containerStyle = window.getComputedStyle(target.parentNode, null);
		var containerDim = getElemDim(containerStyle);

		//target.style.height = Math.round(targetDim.Height / containerDim.Height * 100.0) + "cqh";
		//target.style.width = Math.round(targetDim.Width / containerDim.Width * 100.0) + "cqw";

		document.onmouseup = null;
		document.ontouchend = null;
	}

	document.onmouseup = resizingDone;
	document.ontouchend = resizingDone;
}

document.onmousedown = mouseEventHandler;
document.ontouchstart = mouseEventHandler;
