
import { createUUID, safeString, maskBelow, showEditor } from './utils.js';
import { selectedGroupId } from './groups.js';
import { widgetsData } from './widgets.js';

export var selectedSensorId = "";

var newSensorSeq = 0;

// save clicked (last used) group id (uhm...)
function saveSensorId(id) {
	selectedSensorId = id;
}

window.saveSensorId = saveSensorId;

// get all custom sensors styles names (classes) from loaded CSS file
// see nonsens.css
// and styles/sensors.css
function sensorGetCustomStyles() {
	// 0 - top css file (nonsens.css)
	// 1 - second inluded file (styles/sensors.css)
	// 0 - first class selector inside sensors.css file (.sensor-container)
	// all custom classes are inside .sensor-container and start with '&.[A-Z]'
	const rules = document.styleSheets[0].cssRules[1].styleSheet.cssRules[0].cssRules;
	var styles = [];

	for (let i = 0; i < rules.length; i ++) {
		if (rules[i] && rules[i].selectorText.match(/^&\.[A-Z]/)) {
			styles.push(rules[i].selectorText.split(".")[1]);
		}
	}

	return styles;
}

var customSensorStyles = sensorGetCustomStyles();


// add new sensor
function sensorAdd() {
console.log(widgetsData);
	// sensor template
	var uuid = createUUID();
	const template = `
		<fieldset id="sc-${uuid}" class="sensor-container Default">
			<legend id="st-${uuid}" class="drag-handle sensor-legend">New Sensor #${newSensorSeq}</legend>
			<div id="s-${uuid}" title="Click for sensor menu" class="sensor" onclick="saveSensorId('${uuid}');"></div>
			<div class="resize-handle">&nbsp;</div>
		</fieldset>
	`;
	newSensorSeq ++;

	// add to group, not to group container
	document.getElementById("g-"+selectedGroupId).innerHTML += template;

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

	var edStyles = editor.querySelector("#sensor-edit-style");
	// populate with available styles
	edStyles.innerHTML = "";
	for (let i = 0; i < customSensorStyles.length; i ++) {
		var style = customSensorStyles[i];
		edStyles.innerHTML += `<option value="${style}">${style}</option>`;
	}
	// set current style
	edStyles.value = sensorC.className.split(" ")[1];

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

	var oldStyle = sensorC.className.split(" ")[1];
	sensorC.classList.replace(oldStyle, editor.querySelector("#sensor-edit-style").value);

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
