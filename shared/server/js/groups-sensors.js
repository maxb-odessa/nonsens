
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

// primitive string (un)sanitizer
function safeString(str, toSafe) {
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

var newGroupSeq = 0;

// generate new group html code and insert it
function groupAdd(containerId) {

	// group template
	var uuid = createUUID();
	const template = `
		<fieldset id="gc-${uuid}" class="group-container">
			<legend id="gt-${uuid}" class="drag-handle group-legend">New Group #${newGroupSeq}</legend>
			<div id="g-${uuid}" title="Click for group menu" class="group" onclick="saveGroupId('${uuid}');"></div>
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
	var editor = document.getElementById(editorId);
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

	var editor = document.getElementById(editorId);
	var groupC = document.getElementById("gc-"+savedGroupId); // group container
	var groupT = groupC.querySelector("#gt-"+savedGroupId); // group title
	var group = groupC.querySelector("#g-"+savedGroupId);  // group itself

	// fill in editor with current group data
	editor.querySelector("#group-edit-title").value = safeString(groupT.innerHTML, false);

	var titleStyle = window.getComputedStyle(groupT);
	editor.querySelector("#group-edit-title-color").value = titleStyle.color;
	editor.querySelector("#group-edit-title-bg-color").value = titleStyle.backgroundColor;

	var groupStyle = window.getComputedStyle(group);
	editor.querySelector("#group-edit-bg-color").value = groupStyle.backgroundColor;

	// show editor
	showEditor(editorId, true);

	return true;
}

// apply group params from editor
function groupApply(editorId) {

	var editor = document.getElementById(editorId);
	var groupC = document.getElementById("gc-"+savedGroupId);
	var groupT = groupC.querySelector("#gt-"+savedGroupId);
	var group = groupC.querySelector("#g-"+savedGroupId);

	// fill in editor with current group data
	groupT.innerHTML = safeString(editor.querySelector("#group-edit-title").value, true);

	groupT.style.color = editor.querySelector("#group-edit-title-color").value;
	groupT.style.backgroundColor = editor.querySelector("#group-edit-title-bg-color").value;

	group.style.backgroundColor = editor.querySelector("#group-edit-bg-color").value;

	return true;
}

// delete a group
function groupDelete() {

	// delete the group
	if (confirm("You are going to DELETE the group and all its sensors!\nConfirm?")) {
		// delete whole group container
		document.getElementById("gc-"+savedGroupId).remove();
	}

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
			<legend id="st-${uuid}" class="drag-handle sensor-legend">New Sensor #${newSensorSeq}</legend>
			<div id="s-${uuid}" title="Click for sensor menu" class="sensor" onclick="saveSensorId('${uuid}');"></div>
			<div class="resize-handle">&nbsp;</div>
		</fieldset>
	`;
	newSensorSeq ++;

	// add to group, not to group container
	document.getElementById("g-"+savedGroupId).innerHTML += template;

	// TODO create sensor widget, put it inside sensor div (s-${uuid})

	// add sensor data defaults to the sensor
	// (same as in backend)
	newSensor = document.getElementById("s-" + uuid);
	var data = JSON.stringify(
		{
			"type":		"file",
			"path":		"",
			"keep_open":	true,
			"poll_ms":	1.0,
			"min":		0,
			"max":		100,
			"divider":	1.0,
			"precision":	1,
			"suffix":	""
		}
	);
	newSensor.setAttribute("data-sensor", data);
}

var savedSensorId = "";

// save clicked (last used) group id (uhm...)
function saveSensorId(id) {
	savedSensorId = id;
}

// edit the sensor
function sensorEdit(editorId) {

	var editor = document.getElementById(editorId);
	var sensorC = document.getElementById("sc-"+savedSensorId);
	var sensorT = sensorC.querySelector("#st-"+savedSensorId);
	var sensor = sensorC.querySelector("#s-"+savedSensorId);

	// fill in editor with current sensor data
	editor.querySelector("#sensor-edit-title").value = safeString(sensorT.innerHTML, false);

	var titleStyle = window.getComputedStyle(sensorT);
	editor.querySelector("#sensor-edit-title-color").value = titleStyle.color;
	editor.querySelector("#sensor-edit-title-bg-color").value = titleStyle.backgroundColor;

	var sensorStyle = window.getComputedStyle(sensor);
	editor.querySelector("#sensor-edit-bg-color").value = sensorStyle.backgroundColor;

	// get sensor settings
	var sensorData = JSON.parse(sensor.getAttribute("data-sensor"));
	editor.querySelector("#sensor-edit-source-path").value = sensorData.path;
	editor.querySelector("#sensor-edit-source-type").value = sensorData.type;
	editor.querySelector("#sensor-edit-source-keepopen").checked = sensorData.keep_open;
	editor.querySelector("#sensor-edit-source-poll").value = sensorData.poll_ms;
	editor.querySelector("#sensor-edit-value-min").value = sensorData.min;
	editor.querySelector("#sensor-edit-value-max").value = sensorData.max;
	editor.querySelector("#sensor-edit-value-divider").value = sensorData.divider;
	editor.querySelector("#sensor-edit-value-precision").value = sensorData.precision;
	editor.querySelector("#sensor-edit-value-suffix").value = sensorData.suffix;

/*
widget colors, gradient, etc...
select css style?
*/

	// show editor
	showEditor(editorId, true);
}

// apply sensor params from editor
function sensorApply(editorId) {

	var editor = document.getElementById(editorId);
	var sensorC = document.getElementById("sc-"+savedSensorId);
	var sensorT = sensorC.querySelector("#st-"+savedSensorId);
	var sensor = sensorC.querySelector("#s-"+savedSensorId);

	// fill in editor with current sensor data
	sensorT.innerHTML = safeString(editor.querySelector("#sensor-edit-title").value, true);
	sensorT.style.color = editor.querySelector("#sensor-edit-title-color").value;
	sensorT.style.backgroundColor = editor.querySelector("#sensor-edit-title-bg-color").value;

	sensor.style.backgroundColor = editor.querySelector("#sensor-edit-bg-color").value;

	var sensorData = {
		"path":		editor.querySelector("#sensor-edit-source-path").value,
		"type":		editor.querySelector("#sensor-edit-source-type").value,
		"keep_open":	editor.querySelector("#sensor-edit-source-keepopen").checked,
		"poll_ms":	editor.querySelector("#sensor-edit-source-poll").value,
		"min":		editor.querySelector("#sensor-edit-value-min").value,
		"max":		editor.querySelector("#sensor-edit-value-max").value,
		"divider":	editor.querySelector("#sensor-edit-value-divider").value,
		"precision":	editor.querySelector("#sensor-edit-value-precision").value,
		"suffix":	editor.querySelector("#sensor-edit-value-suffix").value
	};

	// store sensor data
	sensor.setAttribute("data-sensor", JSON.stringify(sensorData));
}

// delete a sensor
function sensorDelete() {

	// delete the sensor
	if (confirm("You are going to DELETE the sensor!\nConfirm?")) {
		// delete whole sensor container
		document.getElementById("sc-"+savedSensorId).remove();
	}
}


// make sensor widget (s = [sensor Obj], data = [new sensor values])
// TODO
function makeSensorWidget(s, data) {
	s.innerHTML = `<b>1</b>`;
}
