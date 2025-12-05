
import { createUUID, safeString, maskBelow, showEditor } from './utils.js';
import { selecteGroupId } from './groups.js';

export var selectedSensorId = "";

var newSensorSeq = 0;

// save clicked (last used) group id (uhm...)
function saveSensorId(id) {
	selectedSensorId = id;
}

window.saveSensorId = saveSensorId;

// add new sensor
function sensorAdd() {

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
	document.getElementById("g-"+selecteGroupId).innerHTML += template;

	// TODO create sensor widget, put it inside sensor div (s-${uuid})

	// add sensor data defaults to the sensor
	// (same as in backend)
	var newSensor = document.getElementById("s-" + uuid);
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


// edit the sensor
function sensorEdit(editorId) {

	var editor = document.getElementById(editorId);
	var sensorC = document.getElementById("sc-"+selectedSensorId);
	var sensorT = sensorC.querySelector("#st-"+selectedSensorId);
	var sensor = sensorC.querySelector("#s-"+selectedSensorId);

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
	var sensorC = document.getElementById("sc-"+selectedSensorId);
	var sensorT = sensorC.querySelector("#st-"+selectedSensorId);
	var sensor = sensorC.querySelector("#s-"+selectedSensorId);

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
		document.getElementById("sc-"+selectedSensorId).remove();
	}
}


// make sensor widget (s = [sensor Obj], data = [new sensor values])
// TODO
function makeSensorWidget(s, data) {
	s.innerHTML = `<b>1</b>`;
}

export { sensorAdd, sensorEdit, sensorDelete, sensorApply };
