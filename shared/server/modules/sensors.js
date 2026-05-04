
import { createUUID, safeString, maskBelow, showEditor, parseColor, makeColor, getCustomStyles } from './utils.js';
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

var customSensorStyles = getCustomStyles(".sensor-container");

// add new sensor
function sensorAdd() {

	// sensor template
	var uuid = createUUID();
	const template =
		`<fieldset id="sc-${uuid}" class="sensor-container resizable Default">` +
			`<legend id="st-${uuid}" class="sensor-legend">New Sensor #${newSensorSeq}</legend>` +
			`<div id="s-${uuid}" class="sensor"></div>` +
			`<div data-menu="sensor-menu" onclick="saveSensorId('${uuid}');" style="position: absolute; width: 100%; height: 100%; z-index: 300; background-color: #00000000;"></div>` +
		`</fieldset>`;
	newSensorSeq ++;

	// add to group, not to group container
	document.getElementById("g-"+selectedGroupId).innerHTML += template;

	// add sensor data defaults to the sensor
	// (same as in backend)
	var newSensor = document.getElementById("s-" + uuid);

	newSensor.dataset.type = "file";
	newSensor.dataset.path = "0:0:/path/to/file";
	newSensor.dataset.keepOpen = true;
	newSensor.dataset.pollMs = 1000;
	newSensor.dataset.min = 0.0;
	newSensor.dataset.max = 100.0;
	newSensor.dataset.divider = 1.0;
	newSensor.dataset.autoScale = false;
	newSensor.dataset.precision = 1.0;
	newSensor.dataset.suffix = "";
	newSensor.dataset.widget = "Default";
	newSensor.dataset.widgetValueAbs = true;
	newSensor.dataset.widgetColor1 = "green";
	newSensor.dataset.widgetColor2 = "yellow";
	newSensor.dataset.widgetColor2Percents = "50";
	newSensor.dataset.widgetColor3 = "red";
	newSensor.dataset.widgetGradient = true;

	// indicate this is a "new" sensor
	var newSensorC = document.getElementById("sc-" + uuid);
	var newSensorT = document.getElementById("st-" + uuid);
	var randColor = "#" + Math.floor(Math.random()*16777215).toString(16);
	//newSensorC.style.backgroundColor = randColor;
	newSensorT.style.backgroundColor = randColor;

	// send new sensor to server via WS
	wsSaveSensor("s-"+uuid, sensorDataToJson(newSensor), "add");

	// save whole layout!
	saveLayout();
}

// clone a sensor
function sensorClone() {

	// get sensor object
	var oldSensor = document.getElementById("sc-" + selectedSensorId);
	var oldSensorHTML = oldSensor.outerHTML;

	// create new uuid for cloned sensor
	var uuid = createUUID();

	// replace all old uuids with new one
	var clonedSensorHTML = oldSensorHTML.replaceAll(selectedSensorId, uuid);

	// add cloned sensor
	oldSensor.parentNode.insertAdjacentHTML('beforeend', clonedSensorHTML);

	// get newly cloned sensor
	var clonedSensorC = document.getElementById("sc-" + uuid);

	// preserve old sensor dataset (keep replacing old uuid with new one)
	var oldSensorDataset = document.getElementById("s-" + selectedSensorId).dataset;
	for (var d in oldSensorDataset) {
		clonedSensorC.dataset[d] = oldSensorDataset[d].replaceAll(selectedSensorId, uuid);
	}

	// indicate this is a "new" sensor
	var clonedSensorT = document.getElementById("st-" + uuid);
	var randColor = "#" + Math.floor(Math.random()*16777215).toString(16);
	//clonedSensorC.style.backgroundColor = randColor;
	clonedSensorT.style.backgroundColor = randColor;

	// send new sensor to server via WS
	wsSaveSensor("s-"+uuid, sensorDataToJson(clonedSensorC), "add");

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
	// set current style (must be the last in the list)
	var sensorStyles = sensorC.className.split(" ");
	edStyles.value = sensorStyles[sensorStyles.length - 1];

	if (sensorC.style.transform) {
		editor.querySelector("#sensor-edit-rotate").value = sensorC.style.transform.match(/-?\d+/)[0];
	} else {
		editor.querySelector("#sensor-edit-rotate").value = "0";
	}

	editor.querySelector("#sensor-edit-title").value = safeString(sensorT.innerHTML, false);

	var titleStyle = window.getComputedStyle(sensorT);
	editor.querySelector("#sensor-edit-title-color").value = titleStyle.color;
	var titleBgColor = parseColor(titleStyle.backgroundColor);
	editor.querySelector("#sensor-edit-title-bg-color").value = titleBgColor.hex;
	editor.querySelector("#sensor-edit-title-bg-color-alpha").value = titleBgColor.a;

	var contStyle = window.getComputedStyle(sensorC);
	var contBgColor = parseColor(contStyle.backgroundColor);
	editor.querySelector("#sensor-edit-bg-color").value = contBgColor.hex;
	editor.querySelector("#sensor-edit-bg-color-alpha").value = contBgColor.a;
	editor.querySelector("#sensor-edit-bg-grid").checked = sensor.classList.contains("grid");

	var sensorStyle = window.getComputedStyle(sensor);

	// get sensor settings
	editor.querySelector("#sensor-edit-source-type").value = sensor.dataset.type;
	editor.querySelector("#sensor-edit-source-path").value = sensor.dataset.path;
	editor.querySelector("#sensor-edit-source-keepopen").checked = (sensor.dataset.keepOpen == "true");
	editor.querySelector("#sensor-edit-source-pollms").value = sensor.dataset.pollMs;
	editor.querySelector("#sensor-edit-value-min").value = sensor.dataset.min;
	editor.querySelector("#sensor-edit-value-max").value = sensor.dataset.max;
	editor.querySelector("#sensor-edit-value-divider").value = sensor.dataset.divider;
	editor.querySelector("#sensor-edit-value-autoscale").checked = (sensor.dataset.autoScale == "true");
	editor.querySelector("#sensor-edit-value-precision").value = sensor.dataset.precision;
	editor.querySelector("#sensor-edit-value-suffix").value = safeString(sensor.dataset.suffix, false);

	var edWidget = editor.querySelector("#sensor-edit-widget");
	// populate with available widgets
	edWidget.innerHTML = "";
	widgetsData.forEach(
		function(v, k, m) {
			edWidget.innerHTML += `<option value="${k}">${k}</option>`;
		}
	);
	edWidget.value = sensor.dataset.widget;

	editor.querySelector("#sensor-edit-widget-value-abs").value = sensor.dataset.widgetValueAbs;
	editor.querySelector("#sensor-edit-widget-bar-color1").value = sensor.dataset.widgetColor1;
	editor.querySelector("#sensor-edit-widget-bar-color2").value = sensor.dataset.widgetColor2;
	editor.querySelector("#sensor-edit-widget-bar-color2-percents").value = sensor.dataset.widgetColor2Percents;
	editor.querySelector("#sensor-edit-widget-bar-color3").value = sensor.dataset.widgetColor3;
	editor.querySelector("#sensor-edit-widget-bar-gradient").checked = (sensor.dataset.widgetGradient == "true");

	// ugly, the func is defined in index.html but is called within this module (and within index.html too)
	editor.querySelector("#widget-bar-color-picker").style.background = makeGradient();

	// show editor
	showEditor(editorId, true);
}

// apply sensor params from editor
function sensorApply(editorId) {

	var editor = document.getElementById(editorId);
	var sensorC = document.getElementById("sc-"+selectedSensorId);
	var sensorT = sensorC.querySelector("#st-"+selectedSensorId);
	var sensor = sensorC.querySelector("#s-"+selectedSensorId);

	var sensorStyles = sensorC.className.split(" ");
	var oldStyle = sensorStyles[sensorStyles.length - 1]; // the last one is a custom style
	sensorC.classList.replace(oldStyle, editor.querySelector("#sensor-edit-style").value);

	// TODO: check sensor edges are out of group container and adjust sensor dims
	sensorC.style.transform = "rotate(" + editor.querySelector("#sensor-edit-rotate").value + "deg)";

	sensorT.innerHTML = safeString(editor.querySelector("#sensor-edit-title").value, true);
	sensorT.style.color = editor.querySelector("#sensor-edit-title-color").value;
	var titleBgColor = parseColor(editor.querySelector("#sensor-edit-title-bg-color").value);
	titleBgColor.a = editor.querySelector("#sensor-edit-title-bg-color-alpha").value;
	sensorT.style.backgroundColor = makeColor(titleBgColor).rgba;
	sensorT.style.borderColor = sensorT.style.backgroundColor;
	sensorC.style.borderColor = sensorT.style.backgroundColor;

	var contBgColor = parseColor(editor.querySelector("#sensor-edit-bg-color").value);
	contBgColor.a = editor.querySelector("#sensor-edit-bg-color-alpha").value;
	sensorC.style.backgroundColor = makeColor(contBgColor).rgba;
	if (editor.querySelector("#sensor-edit-bg-grid").checked) {
		sensor.classList.add("grid");
	} else {
		sensor.classList.remove("grid");
	}

	// store sensor data
	sensor.dataset.path = editor.querySelector("#sensor-edit-source-path").value;
	sensor.dataset.type = editor.querySelector("#sensor-edit-source-type").value;
	sensor.dataset.keepOpen = editor.querySelector("#sensor-edit-source-keepopen").checked;
	sensor.dataset.pollMs = editor.querySelector("#sensor-edit-source-pollms").value;
	sensor.dataset.min = editor.querySelector("#sensor-edit-value-min").value;
	sensor.dataset.max = editor.querySelector("#sensor-edit-value-max").value;
	sensor.dataset.divider = editor.querySelector("#sensor-edit-value-divider").value;
	sensor.dataset.autoScale = editor.querySelector("#sensor-edit-value-autoscale").checked;
	sensor.dataset.precision = editor.querySelector("#sensor-edit-value-precision").value;
	sensor.dataset.suffix = safeString(editor.querySelector("#sensor-edit-value-suffix").value, true);
	sensor.dataset.widget = editor.querySelector("#sensor-edit-widget").value;
	sensor.dataset.widgetValueAbs = editor.querySelector("#sensor-edit-widget-value-abs").value == 'true';
	sensor.dataset.widgetColor1 = editor.querySelector("#sensor-edit-widget-bar-color1").value;
	sensor.dataset.widgetColor2 = editor.querySelector("#sensor-edit-widget-bar-color2").value;
	sensor.dataset.widgetColor2Percents = editor.querySelector("#sensor-edit-widget-bar-color2-percents").value;
	sensor.dataset.widgetColor3 = editor.querySelector("#sensor-edit-widget-bar-color3").value;
	sensor.dataset.widgetGradient = editor.querySelector("#sensor-edit-widget-bar-gradient").checked;

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
		"type": s.dataset.type,
		"path": s.dataset.path,
		"keep_open": s.dataset.keepOpen && true,
		"poll_ms": s.dataset.pollMs * 1,
		"min": s.dataset.min * 1.0,
		"max": s.dataset.max * 1.0,
		"auto_scale": s.dataset.autoScale && true,
		"divider": s.dataset.divider * 1.0,
	});
}


window.sensorAdd = sensorAdd;
window.sensorClone = sensorClone;
window.sensorEdit = sensorEdit;
window.sensorDelete = sensorDelete;
window.sensorApply = sensorApply;


