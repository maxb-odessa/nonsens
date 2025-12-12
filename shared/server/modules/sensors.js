
import { createUUID, safeString, maskBelow, showEditor } from './utils.js';
import { selectedGroupId } from './groups.js';
import { widgetsData } from './widgets.js';
import { wsSaveSensor } from './ws.js';

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
	var sDataJson = JSON.stringify(
		{
			"type":		"file",
			"path":		"0:0:/path/to/file",
			"keep_open":	true,
			"poll_ms":	1000*1,
			"min":		0*1,
			"max":		100*1,
			"divider":	1.0*1,
			"precision":	1*1,
			"suffix":	"",
			"widget":	"Default"
		}
	);
	newSensor.setAttribute("data-sensor", sDataJson);

	// send new sensor to server via WS
	wsSaveSensor("s-"+uuid, sDataJson, "add");

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

	var edWidget = editor.querySelector("#sensor-edit-widget");
	// populate with available widgets
	edWidget.innerHTML = "";
	widgetsData.forEach(
		function(v, k, m) {
			edWidget.innerHTML += `<option value="${k}">${k}</option>`;
		}
	);
	edWidget.value = sensorData.widget;

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
		"poll_ms":	editor.querySelector("#sensor-edit-source-poll").value*1,
		"min":		editor.querySelector("#sensor-edit-value-min").value*1,
		"max":		editor.querySelector("#sensor-edit-value-max").value*1,
		"divider":	editor.querySelector("#sensor-edit-value-divider").value*1,
		"precision":	editor.querySelector("#sensor-edit-value-precision").value,
		"suffix":	editor.querySelector("#sensor-edit-value-suffix").value,
		"widget":	editor.querySelector("#sensor-edit-widget").value
	};

	var sDataJson = JSON.stringify(sensorData);

	// store sensor data
	sensor.setAttribute("data-sensor", sDataJson);

	// send updated sensor to server via WS
	wsSaveSensor(sensor.id, sDataJson, "update");
}


// delete a sensor
function sensorDelete() {

	// delete the sensor
	if (confirm("You are going to DELETE the sensor!\nConfirm?")) {
		let sensorC = document.getElementById("sc-"+selectedSensorId);
		// stop and delete sensor on server side
		wsSaveSensor("s-"+selectedSensorId, "", "delete");
		// delete whole sensor container
		sensorC.remove();
	}

}


window.sensorAdd = sensorAdd;
window.sensorEdit = sensorEdit;
window.sensorDelete = sensorDelete;
window.sensorApply = sensorApply;


