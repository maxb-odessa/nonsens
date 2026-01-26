
// simple 'UUID' making function
function createUUID() {
	var s = [];
	var hexDigits = "0123456789ABCDEF";
	for (var i = 0; i < 16; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	return s.join("");
}

// primitive string (un)sanitizer
function safeString(str, toSafe) {

	if (! str) {
		return "";
	}

	var res = str;

	if (toSafe) {
		//res = res.replace('&', '&amp;'); // must be the first
		res = res.replaceAll('$', '&#37;');
		res = res.replaceAll('<', '&lt;');
		res = res.replaceAll('>', '&gt;');
		res = res.replaceAll(' ', '&#32;');
		res = res.replaceAll("'", '&apos;');
		res = res.replaceAll('"', '&quot;');
	} else {
		res = res.replaceAll('&lt;', '<');
		res = res.replaceAll('&gt;', '>');
		res = res.replaceAll('&#32;', ' ');
		res = res.replaceAll('&nbsp;', ' ');
		res = res.replaceAll('&apos;', "'");
		res = res.replaceAll('&quot;', '"');
		res = res.replaceAll('&#37;', '$');
		//res = res.replace('&amp;', '&' ); // must be the last
	}

	return res;
}

// convert any color format into any (rgb, rgba, hex, hexa)
// note: not validating color range values
// result:
// src - original color string
// r, g, b, a - parsed color values (a = 255 if missed)
// rgb - rgb() formar
// rgba - rgba() format
// hex - #hex format
// hexa - #hexa format
function parseColor(what) {

	var result = {};
	result.src = what;

	// determine input format

	// hex: #AABBCCDD, DD is optional, short version #ABC is not supported
	if (what.substring(0, 1) === "#" && what.length >= 7) {
		var colors = what.split(/([0-9A-F]{2})/i);
		if (colors.length > 5) {
			result.r = parseInt(colors[1], 16) * 1;;
			result.g = parseInt(colors[3], 16) * 1;
			result.b = parseInt(colors[5], 16) * 1;
			if (colors[7]) {
				result.a = parseInt(colors[7], 16) * 1;
			}
		}
	// rgba: rgba(1,2,3,0.4), a is optional
	} else if (what.substring(0, 3) === "rgb") {
		var colors = what.split(/([0-9.]{1,5})/);
		if (colors.length > 5) {
			result.r = colors[1] * 1;
			result.g = colors[3] * 1;
			result.b = colors[5] * 1;
			if (colors[7]) {
				result.a = Math.floor(colors[7] * 255.0);
			}
		}
	}

	// is parse successful? note, a is optional but should be correct if present
	if (isNaN(result.r) || isNaN(result.g) || isNaN(result.b) || (result.a && isNaN(result.a))) {
		return result;
	}

	// make new color formats and return them
	return makeColor(result);
}

// compose color strings from r,g and b (plus optional a) values (see above)
function makeColor(what) {

	// opacity is missing, make in FF
	if (what.a === undefined) {
		what.a = 255 * 1;
	}

	// compose all possible color formats
	what.hex = "#" +
			what.r.toString(16).padStart(2, 0) +
			what.g.toString(16).padStart(2, 0) +
			what.b.toString(16).padStart(2, 0);
	what.hexa = what.hex + what.a.toString(16).padStart(2, 0);

	what.rgb = `rgb(${what.r}, ${what.g}, ${what.b})`;
	what.rgba = `rgba(${what.r}, ${what.g}, ${what.b}, ${(what.a / 255.0).toFixed(2)})`;

	return what;
}

// show/hide window mask to prevent interaction with lower elements
// TODO make it 'stackable' - remember mask zIndex on subsequent calls
function maskBelow(id, doMask) {
	var elem = document.getElementById(id);
	var mask = document.getElementById('masked-below');

	var elemStyle = window.getComputedStyle(elem);

	if (doMask) {
		mask.style.zIndex = elemStyle.zIndex - 1;
	} else {
		mask.style.zIndex = -1;
	}
}

// show notice window popup
const popupDelay = ms => new Promise(res => setTimeout(res, ms));

async function showInfo(text, show, timeOut) {
	let popup = document.getElementById("info-popup");
	let textArea = popup.querySelector("#popup-text-area");
	if (show) {
		textArea.innerHTML = text;
		popup.style.display = "block";
		if (timeOut > 0) {
			await popupDelay(timeOut);
			popup.style.display = "none"
		}
	} else {
		popup.style.display = "none";
	}
}

window.showInfo = showInfo;

// show/hide editor
function showEditor(editorId, show, noteAfter, noteDelayMs) {
	var editor = document.getElementById(editorId);
	if (show) {
		editor.style.display = "inline-block";
		maskBelow(editor.id, true);

	} else {
		editor.style.display = "none";
		maskBelow(editor.id, false);
		if (noteAfter) {
			showInfo(noteAfter, true, noteDelayMs);
		}
	}

	return true;
}

window.showEditor = showEditor;


export { createUUID, safeString, maskBelow, showEditor, parseColor, makeColor };
