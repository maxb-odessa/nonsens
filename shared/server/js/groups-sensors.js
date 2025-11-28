
// from: https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
function createUUID() {
	// http://www.ietf.org/rfc/rfc4122.txt
	var s = [];
	var hexDigits = "0123456789abcdef";
	for (var i = 0; i < 36; i++) {
        	s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
	s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
	//s[8] = s[13] = s[18] = s[23] = "-";

	var uuid = s.join("");
	return uuid;
}

var newGroupSeq = 0;

// generate new group html code and insert it
function groupAdd(containerId) {

	// group template
	var uuid = createUUID();
	const template = `
		<fieldset id="gc-${uuid}" class="group-container">
			<legend id="group-title-${uuid}" class="drag-handle group-legend">New Group #${newGroupSeq}</legend>
			<div id="gr-${uuid}" title="Click for group menu" class="group" onclick="saveGroupId('${uuid}');"></div>
			<div class="resize-handle">&nbsp;</div>
		</fieldset>
	`;
	newGroupSeq ++;

	document.getElementById(containerId).innerHTML += template;

	return true;
}

var savedGroupId = "";

// save clicked (last used) group id (uhm...)
function saveGroupId(id) {
	savedGroupId = id;
	return true;
}

function showEditor(editorId, show) {
	editor = document.getElementById(editorId);
	if (show) {
		editor.style.display = "inline-block";
		maskBelow(editor.id, true);

	} else {
		editor.style.display = "none";
		maskBelow(editor.id, false);
	}

	return true;
}

// edit the group
function groupEdit(editorId) {

	editor = document.getElementById(editorId);
	group = document.getElementById("gc-"+savedGroupId);

	// fill in editor with current group data
	editor.querySelector("#group-edit-title").value = group.querySelector("#group-title-"+savedGroupId).innerHTML;
	titleStyle = window.getComputedStyle(group.querySelector("#group-title-"+savedGroupId));
	editor.querySelector("#group-edit-title-color").value = titleStyle.color;
	editor.querySelector("#group-edit-title-bg-color").value = titleStyle.backgroundColor;
// TODO del opacity, add background in rgba() shape. Parse bg-color, extract opacity. Combine whne saving
	editor.querySelector("#group-edit-title-bg-color-opacity").value = titleStyle.opacity;
	groupStyle = window.getComputedStyle(group.querySelector("#gr-"+savedGroupId));
	editor.querySelector("#group-edit-bg-color").value = groupStyle.backgroundColor;

	// show editor
	showEditor(editorId, true);

	return true;
}

// apply group params from editor
function groupApply(editorId) {

	editor = document.getElementById(editorId);
	group = document.getElementById("gc-"+savedGroupId);

	// fill in editor with current group data
	group.querySelector("#group-title-"+savedGroupId).innerHTML = editor.querySelector("#group-edit-title").value;
	group.querySelector("#group-title-"+savedGroupId).style.color = editor.querySelector("#group-edit-title-color").value;
	group.querySelector("#group-title-"+savedGroupId).style.backgroundColor = editor.querySelector("#group-edit-title-bg-color").value;
	group.querySelector("#group-title-"+savedGroupId).style.opacity = editor.querySelector("#group-edit-title-bg-color-opacity").value;
	group.querySelector("#gr-"+savedGroupId).style.backgroundColor = editor.querySelector("#group-edit-bg-color").value;

	// show editor
	showEditor(editorId, true);

	return true;
}



/*
************ SENSORS
*/


var newSensorSeq = 0;

// add new sensor
function groupAddSensor() {

	// sensor template
	var uuid = createUUID();
	const template = `
		<fieldset id="sc-${uuid}" class="sensor-container">
			<legend class="drag-handle sensor-legend">New Sensor #${newSensorSeq}</legend>
			<div id="se-${uuid}" title="Click for sensor menu" class="sensor" onclick="saveSensorId('${uuid}');"></div>
			<div class="resize-handle">&nbsp;</div>
		</fieldset>
	`;
	newSensorSeq ++;

	// add to group, not group container
	document.getElementById("gr-"+savedGroupId).innerHTML += template;

}

var savedSensorId = "";

// save clicked (last used) group id (uhm...)
function saveSensorId(id) {
	savedSensorId = id;
}

// delete a group
function groupDelete() {

	// delete the group
	if (confirm("You are going to DELETE the group and all its sensors!\nConfirm?")) {
		// delete whole group container
		document.getElementById("gc-"+savedGroupId).remove();
	}
}

// show/hide window mask to prevent interaction with lower elements
function maskBelow(id, doMask) {
	elem = document.getElementById(id);
	mask = document.getElementById('masked-below');

	elemStyle = window.getComputedStyle(elem);

	if (doMask) {
		mask.style.zIndex = elemStyle.zIndex - 1;
	} else {
		mask.style.zIndex = -1;
	}
}

// edit the sensor
function sensorEdit(sensorId) {

	// fill in editor with current sensor data
	sensor = document.getElementById(sensorId);

	// show editor
	showEditor(sensorId, true);
}

// delete a sensor
function sensorDelete() {

	// delete the sensor
	if (confirm("You are going to DELETE the sensor!\nConfirm?")) {
		// delete whole sensor container
		document.getElementById("sc-"+savedSensorId).remove();
	}
}


