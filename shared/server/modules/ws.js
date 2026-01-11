
import { widgetsData } from './widgets.js';

const wsUrl = "ws://" + window.location.hostname + ":" + window.location.port + "/ws";

const WS_MSG_TARGET_LAYOUT = 0;
const WS_MSG_TARGET_SENSOR = 1;

const WS_MSG_ACTION_ADD    = 10;
const WS_MSG_ACTION_DELETE = 11;
const WS_MSG_ACTION_UPDATE = 12;

var wsocket = {};

/* msg structure:
	target: layout or sensor (int)
	id: target id (for sensors) (string)
	action: what to do: update, delete, etc. (int)
	payload: target specific data (JSON format)
*/

// establish websocket communication
async function wsLoop() {


	while (1) {

		var reconnect = false;

		// (re)create a websocket
		wsocket = {};
		wsocket = new WebSocket(wsUrl);

		wsocket.onopen = function() {
			reconnect = false;
		};

		wsocket.onmessage = function(msg) {
			const obj = JSON.parse(msg.data);
			if (obj.target == WS_MSG_TARGET_LAYOUT) {
				// update whole layout, ignore 'action'
				wsUpdateLayout(obj.payload);
			} else if (obj.target == WS_MSG_TARGET_SENSOR) {
				// update sensor data, server can send us only 'update' actions
				wsUpdateSensor(obj.id, obj.payload);
			}
			// ignore everything else
		};

		wsocket.onerror = function(ev) {
			reconnect = true;
		};

		wsocket.onclose = function(ev) {
			reconnect = true;
		};

		// check ws connection every 1000 ms
		async function waitUntil(condition, time = 1000) {
			while (! condition()) {
				await new Promise((resolve) => setTimeout(resolve, time));
			}
		}

		await waitUntil(() => reconnect === true);

	}

};


// prepeare and send ws message
function wsSend(obj) {
	if (wsocket && wsocket.readyState === WebSocket.OPEN) {
		wsocket.send(JSON.stringify(obj));
	} else {
		console.log("wsSend() failed: socket is unavailable");
	}
}

// update whole groups/sensors layout
// div 'main' always exists
function wsUpdateLayout(content) {
	document.getElementById('main').innerHTML = content;
}

// update sensor data
function wsUpdateSensor(id, data) {

	// get sensor object
	var s = document.getElementById(id);
	if (! s) {
		console.log("wsUpdateSensor(" + id + "): not found");
		return;
	}

	// find sensor widget template func
	var widgetTemplateFunc = widgetsData.get(s.getAttribute("data-widget"));
	if (! widgetTemplateFunc) {
		console.log('widgetTemplateFunc(' + s.getAttribute("data-widget") + ') is not defined');
		return;
	}

	// get SOME sensor object options
	var options = {
		min: s.getAttribute("data-min"),
		max: s.getAttribute("data-max"),
		precision: s.getAttribute("data-precision"),
		suffix: s.getAttribute("data-suffix"),
		color1: s.getAttribute("data-widget-bar-color1"),
		color2: s.getAttribute("data-widget-bar-color2"),
		color2P: s.getAttribute("data-widget-bar-color2-percents"),
		color3: s.getAttribute("data-widget-bar-color3"),
		gradient: s.getAttribute("data-widget-bar-gradient"),
	};

	// apply values and options to template + inject new html code into sensor container
	s.innerHTML = widgetTemplateFunc(data, options);
}

// save sensor
function wsSaveSensor(id, data, action) {
	var msg = {
		target: WS_MSG_TARGET_SENSOR,
		id: id,
		payload: data,
	};

	if (action === "update") {
		msg.action = WS_MSG_ACTION_UPDATE;
	} else if (action === "delete") {
		msg.action = WS_MSG_ACTION_DELETE;
	} else if (action === "add") {
		msg.action = WS_MSG_ACTION_ADD;
	}

	wsSend(msg);

}

function wsSaveLayout() {
	wsSend(
		{
			id: "",
			target: WS_MSG_TARGET_LAYOUT,
			action: WS_MSG_ACTION_UPDATE,
			payload: document.getElementById("main").innerHTML
		}
	);
}

window.saveLayout = wsSaveLayout;

export { wsLoop, wsSaveSensor };
