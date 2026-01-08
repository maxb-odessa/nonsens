
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
// NB: ugly solution :(
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
	const template =
		`<fieldset id="sc-${uuid}" class="sensor-container Default">
			<legend id="st-${uuid}" data-menu="sensor-menu" class="drag-handle sensor-legend" onclick="saveSensorId('${uuid}');">New Sensor #${newSensorSeq}</legend>
			<div id="s-${uuid}" class="sensor"></div>
			<div class="resize-handle">&nbsp;</div>
		</fieldset>`;
	newSensorSeq ++;

	// add to group, not to group container
	document.getElementById("g-"+selectedGroupId).innerHTML += template;

	// TODO create sensor widget, put it inside sensor div (s-${uuid})

	// add sensor data defaults to the sensor
	// (same as in backend)
	var newSensor = document.getElementById("s-" + uuid);

	newSensor.setAttribute("data-type", "file");
	newSensor.setAttribute("data-path", "0:0:/path/to/file");
	newSensor.setAttribute("data-keepopen", true);
	newSensor.setAttribute("data-pollms", 1000*1);
	newSensor.setAttribute("data-min", 0.0);
	newSensor.setAttribute("data-max", 100.0);
	newSensor.setAttribute("data-divider", 1.0);
	newSensor.setAttribute("data-precision", 1.0);
	newSensor.setAttribute("data-suffix", "");
	newSensor.setAttribute("data-widget", "Default");
	newSensor.setAttribute("data-widget-bar-color1", "green");
	newSensor.setAttribute("data-widget-bar-color2", "yellow");
	newSensor.setAttribute("data-widget-bar-color2-percents", "50");
	newSensor.setAttribute("data-widget-bar-color3", "red");
	newSensor.setAttribute("data-widget-bar-gradient", true);

	// send new sensor to server via WS
	wsSaveSensor("s-"+uuid, sensorDataToJson(newSensor), "add");

	// save whole layout!
	saveLayout();
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
	editor.querySelector("#sensor-edit-source-type").value = sensor.getAttribute("data-type");
	editor.querySelector("#sensor-edit-source-path").value = sensor.getAttribute("data-path");
	editor.querySelector("#sensor-edit-source-keepopen").checked = sensor.getAttribute("data-keepopen");
	editor.querySelector("#sensor-edit-source-pollms").value = sensor.getAttribute("data-pollms");
	editor.querySelector("#sensor-edit-value-min").value = sensor.getAttribute("data-min");
	editor.querySelector("#sensor-edit-value-max").value = sensor.getAttribute("data-max");;
	editor.querySelector("#sensor-edit-value-divider").value = sensor.getAttribute("data-divider");
	editor.querySelector("#sensor-edit-value-precision").value = sensor.getAttribute("data-precision");
	editor.querySelector("#sensor-edit-value-suffix").value = safeString(sensor.getAttribute("data-suffix"), false);

	var edWidget = editor.querySelector("#sensor-edit-widget");
	// populate with available widgets
	edWidget.innerHTML = "";
	widgetsData.forEach(
		function(v, k, m) {
			edWidget.innerHTML += `<option value="${k}">${k}</option>`;
		}
	);
	edWidget.value = sensor.getAttribute("data-widget");

	editor.querySelector("#sensor-edit-widget-bar-color1").value = safeString(sensor.getAttribute("data-widget-bar-color1"), false);
	editor.querySelector("#sensor-edit-widget-bar-color2").value = safeString(sensor.getAttribute("data-widget-bar-color2"), false);
	editor.querySelector("#sensor-edit-widget-bar-color2-percents").value = safeString(sensor.getAttribute("data-widget-bar-color2-percents"), false);
	editor.querySelector("#sensor-edit-widget-bar-color3").value = safeString(sensor.getAttribute("data-widget-bar-color3"), false);
	editor.querySelector("#sensor-edit-widget-bar-gradient").checked = safeString(sensor.getAttribute("data-widget-bar-gradient"), false);

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

	// store sensor data
	sensor.setAttribute("data-path", editor.querySelector("#sensor-edit-source-path").value);
	sensor.setAttribute("data-type", editor.querySelector("#sensor-edit-source-type").value);
	sensor.setAttribute("data-keepopen", editor.querySelector("#sensor-edit-source-keepopen").checked);
	sensor.setAttribute("data-pollms", editor.querySelector("#sensor-edit-source-pollms").value*1);
	sensor.setAttribute("data-min", editor.querySelector("#sensor-edit-value-min").value*1.0);
	sensor.setAttribute("data-max", editor.querySelector("#sensor-edit-value-max").value*1.0);
	sensor.setAttribute("data-divider", editor.querySelector("#sensor-edit-value-divider").value*1.0);
	sensor.setAttribute("data-precision", editor.querySelector("#sensor-edit-value-precision").value*1);
	sensor.setAttribute("data-suffix", safeString(editor.querySelector("#sensor-edit-value-suffix").value, true));
	sensor.setAttribute("data-widget", editor.querySelector("#sensor-edit-widget").value);
	sensor.setAttribute("data-widget-bar-color1", editor.querySelector("#sensor-edit-widget-bar-color1").value);
	sensor.setAttribute("data-widget-bar-color2", editor.querySelector("#sensor-edit-widget-bar-color2").value);
	sensor.setAttribute("data-widget-bar-color2-percents", editor.querySelector("#sensor-edit-widget-bar-color2-percents").value);
	sensor.setAttribute("data-widget-bar-color3", editor.querySelector("#sensor-edit-widget-bar-color3").value);
	sensor.setAttribute("data-widget-bar-gradient", editor.querySelector("#sensor-edit-widget-bar-gradient").value);

	// send updated sensor to server via WS
	wsSaveSensor(sensor.id, sensorDataToJson(sensor), "update");

	// save layout
	saveLayout();
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

	// save layout
	saveLayout();

}

// compose all sensor data into JSON string
function sensorDataToJson(s) {
	return JSON.stringify({
		"type": s.getAttribute("data-type"),
		"path": s.getAttribute("data-path"),
		"keep_open": s.getAttribute("data-keepopen") && true,
		"poll_ms": s.getAttribute("data-pollms") * 1,
		"min": s.getAttribute("data-min") * 1.0,
		"max": s.getAttribute("data-max") * 1.0,
		"divider": s.getAttribute("data-divider") * 1.0,
	});
}


window.sensorAdd = sensorAdd;
window.sensorEdit = sensorEdit;
window.sensorDelete = sensorDelete;
window.sensorApply = sensorApply;


