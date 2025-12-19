
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
		res = res.replace(`&`, `&amp;`); // must be the first
		res = res.replace(`<`, `&lt;`);
		res = res.replace(`>`, `&gt;`);
		res = res.replace(` `, `&#32;`);
		res = res.replace(`'`, `&apos;`);
		res = res.replace(`"`, `&quot;`);
	} else {
		res = res.replace(`&lt;`, `<`);
		res = res.replace(`&gt;`, `>`);
		res = res.replace(`&#32;`, ` `);
		res = res.replace(`&nbsp;`, ` `);
		res = res.replace(`&apos;`, `'`);
		res = res.replace(`&quot;`, `"`);
		res = res.replace(`&amp;`, `&` ); // must be the last
	}

	return res;
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

export { createUUID, safeString, maskBelow, showEditor };
