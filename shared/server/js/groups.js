
// https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
function createUUID() {
	// http://www.ietf.org/rfc/rfc4122.txt
	var s = [];
	var hexDigits = "0123456789abcdef";
	for (var i = 0; i < 36; i++) {
        	s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
	s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
	s[8] = s[13] = s[18] = s[23] = "-";

	var uuid = s.join("");
	return uuid;
}

// generate new group html code and insert it
var newGroupSeq = 0;
function groupNew(e, containerId, menuId) {
	// group template
	var uuid = createUUID();
	const template = `
		<fieldset id="${uuid}" class="group-container">
			<legend class="drag-handle group-legend">New Group #${newGroupSeq}</legend>
			<div title="Click for group menu" class="group" onclick="saveGroupId(event, '${uuid}');"></div>
			<div class="resize-handle">&nbsp;</div>
		</fieldset>
	`;
	newGroupSeq ++;

	document.getElementById(containerId).innerHTML += template;

	// hide main menu
	document.getElementById(menuId).style.display = "none";
}

// save clicked group id (uhm...)
var savedGroupId = "";
function saveGroupId(e, id) {
	savedGroupId = id;
}

function showGroupEditor(show) {
	editor = document.getElementById('group-editor');
	if (show) {
		editor.style.display = "inline-block";

	} else {
		editor.style.display = "none";
	}
console.log(editor.style);
}

// edit the group
function groupEdit(e, menuId) {

	// hide group menu
	document.getElementById(menuId).style.display = "none";

	// fill in editor with current group data
	editor = document.getElementById('group-editor');


	// show editor
	showGroupEditor(true);
}

// add new sensor
function groupAddSensor(e, menuId) {

	// hide group menu
	document.getElementById(menuId).style.display = "none";
}
