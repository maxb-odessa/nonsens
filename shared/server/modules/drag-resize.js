
// based on:
// https://stackoverflow.com/questions/24050738/javascript-how-to-dynamically-move-div-by-clicking-and-dragging

const gridContainerCols = 64 + 1;
const gridContainerRows = 64 + 1;

/*
function dragResizePrepare() {
	// get main grid dimensions (in cells)
	let gridContainer = document.getElementById('main');
	let gridContainerStyle = window.getComputedStyle(gridContainer);
	gridContainerCols = gridContainerStyle.getPropertyValue('grid-template-columns').split(' ').length+1;
	gridContainerRows = gridContainerStyle.getPropertyValue('grid-template-rows').split(' ').length+1;
}
*/

function dragResize(e) {
/*
	// the DOM may not be ready yet, wait for it
	if (gridContainerCols === undefined && gridContainerRows === undefined) {
		dragResizePrepare();
		return;
	}
*/
	let what = e.target;
	let target = what.parentNode;

	if (what.classList.contains("drag-handle")) {
		dragObject(e, target);
	} else if (what.classList.contains("resize-handle")) {
		resizeObject(e, target);
	}

//m = document.getElementById("main");
//console.log(m.innerHTML);
}

// drag the object
function dragObject(e, t) {

	t.dragging = true;

	document.onmousemove = drag;
	document.ontouchmove = drag;


	// get viewpoint dimensions - it could be resized anytime
/*
	vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
	vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
*/
	let vw = t.parentNode.offsetWidth;
	let vh = t.parentNode.offsetHeight;

	// calc grid cell size in px
	let gridW = Math.round(vw / gridContainerCols);
	let gridH = Math.round(vh / gridContainerRows);


	// Check if Mouse events exist on users' device
	if (e.clientX) {
		t.oldX = e.clientX; // If they exist then use Mouse input
		t.oldY = e.clientY;
	} else {
		t.oldX = e.touches[0].clientX; // Otherwise use touch input
		t.oldY = e.touches[0].clientY;
	}

	let cssObj = window.getComputedStyle(t, null);

	let oldColStart = cssObj.getPropertyValue("grid-column-start") * 1;
	let oldRowStart = cssObj.getPropertyValue("grid-row-start") * 1;

	// get target dim (count in grid cells)
	let colCnt = cssObj.getPropertyValue("grid-column-end") * 1 - oldColStart;
	let rowCnt = cssObj.getPropertyValue("grid-row-end") * 1 - oldRowStart;

	// move target above
	let oldZIndex = cssObj.getPropertyValue("z-index");
	t.style.zIndex = oldZIndex * 1 + 1000;

	function drag(e) {

		e.preventDefault();

		if (! t.dragging) {
			return;
		}

		if (e.clientX) {
			t.distX = e.clientX - t.oldX;
			t.distY = e.clientY - t.oldY;
		} else {
			t.distX = e.touches[0].clientX - t.oldX;
			t.distY = e.touches[0].clientY - t.oldY;
		}


		let colOffset = Math.round(t.distX / gridW);
		let rowOffset = Math.round(t.distY / gridH);

		let newColStart = oldColStart + colOffset;
		let newRowStart = oldRowStart + rowOffset;

		// limits!
		if (newColStart < 1) {
			newColStart = 1;
		}

		if (newColStart + colCnt >= gridContainerCols) {
			newColStart = gridContainerCols - colCnt;
		}

		if (newRowStart < 1) {
			newRowStart = 1;
		}

		if (newRowStart + rowCnt >= gridContainerRows) {
			newRowStart = gridContainerRows - rowCnt;
		}

		t.style.setProperty("grid-column-start", newColStart);
		t.style.setProperty("grid-column-end", newColStart + colCnt);
		t.style.setProperty("grid-row-start", newRowStart);
		t.style.setProperty("grid-row-end", newRowStart + rowCnt);

	}

	function endDrag() {

		t.dragging = false;

		document.onmouseup = null;
		document.onmousemove = null;

		t.style.zIndex = oldZIndex;

	}

	document.onmouseup = endDrag;
	document.ontouchend = endDrag;

}

// resize the object
function resizeObject(e, t) {

	t.resizing = true;

	document.onmousemove = resize;
	document.ontouchmove = resize;


	// get viewpoint dimensions - it could be resized anytime
/*
	vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
	vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
*/
	let vw = t.parentNode.offsetWidth;
	let vh = t.parentNode.offsetHeight;

	// calc grid cell size in px
	let gridW = Math.round(vw / gridContainerCols);
	let gridH = Math.round(vh / gridContainerRows);


	// Check if Mouse events exist on users' device
	if (e.clientX) {
		t.oldX = e.clientX; // If they exist then use Mouse input
		t.oldY = e.clientY;
	} else {
		t.oldX = e.touches[0].clientX; // Otherwise use touch input
		t.oldY = e.touches[0].clientY;
	}

	let cssObj = window.getComputedStyle(t, null);

	let oldColStart = cssObj.getPropertyValue("grid-column-start") * 1;
	let oldRowStart = cssObj.getPropertyValue("grid-row-start") * 1;

	// get target dim (count in grid cells)
	let oldColEnd = cssObj.getPropertyValue("grid-column-end") * 1;
	let oldRowEnd = cssObj.getPropertyValue("grid-row-end") * 1;

/*
	// get scale
	oldScale = cssObj.getPropertyValue("scale").split(" ");
	oldScaleX = oldScale[0];
	if (oldScale.length > 1) {
		oldScaleY = oldScale[1];
	} else {
		oldScaleY = oldScale[0];
	}
*/
	// move target above
	let oldZIndex = cssObj.getPropertyValue("z-index");
	t.style.zIndex = oldZIndex * 1 + 1000;

	function resize(e) {

		e.preventDefault();

		if (! t.resizing) {
			return;
		}

		if (e.clientX) {
			t.distX = e.clientX - t.oldX;
			t.distY = e.clientY - t.oldY;
		} else {
			t.distX = e.touches[0].clientX - t.oldX;
			t.distY = e.touches[0].clientY - t.oldY;
		}


		let colOffset = Math.round(t.distX / gridW);
		let rowOffset = Math.round(t.distY / gridH);

		let newColEnd = oldColEnd + colOffset;
		let newRowEnd = oldRowEnd + rowOffset;

		// limits!
		if (newColEnd < oldColStart) {
			newColEnd = oldColStart;
		}

		if (newColEnd > gridContainerCols) {
			newColEnd = gridContainerCols;
		}

		if (newRowEnd < oldRowStart) {
			newRowEnd = oldRowStart;
		}

		if (newRowEnd > gridContainerRows) {
			newRowEnd = gridContainerRows;
		}
/*
console.log(oldColEnd);
console.log(oldRowEnd);
console.log(newColEnd);
console.log(newRowEnd);
console.log("==========");
*/
		t.style.removeProperty("top");
		t.style.removeProperty("left");
		t.style.setProperty("grid-column-end", newColEnd);
		t.style.setProperty("grid-row-end", newRowEnd);

		//t.style.transform = "scale(" + (newColEnd+1)/(oldColEnd+1) + ", " + (newRowEnd+1) / (oldRowEnd+1)+ ")";
/*
console.log(t.style.cssText);
console.log("=========");
*/
	}

	function endResize() {

		t.resizing = false;

		document.onmouseup = null;
		document.onmousemove = null;

		// restore saved styles
		t.style.zIndex = oldZIndex;

	}

	document.onmouseup = endResize;
	document.ontouchend = endResize;

}


document.onmousedown = dragResize;
document.ontouchstart = dragResize;


