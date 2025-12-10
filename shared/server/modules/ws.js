
const wsUrl = "ws://" + window.location.hostname + ":" + window.location.port + "/ws";

const WS_MSG_TARGET_LAYOUT = 0;
const WS_MSG_TARGET_SENSOR = 1;
const WS_MSG_ACTION_ADD    = 10;
const WS_MSG_ACTION_DELETE = 11;
const WS_MSG_ACTION_UPDATE = 12;

var wsocket = {};

// establish websocket communication
async function wsLoop() {


	while (1) {

		let reconnect = false;

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
				// update sensor data, ignore 'action'
				wsUpdateSensor(obj.payload);
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
	if (wsocket) {
		wsocket.send(JSON.stringify(obj));
	} else {
		console.log("wsSend() faile: socket is unavailable");
	}
}

// update whole groups/sensors layout
// div 'main' always exists
function wsUpdateLayout(content) {
	document.getElementById('main').innerHTML = content;
}

// update sensor data
function wsUpdateSensor(data) {
	// TODO
}

// save sensor
function wsSaveSensor(data, action) {
	var msg = {
		target: WS_MSG_TARGET_SENSOR,
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
			target: WS_MSG_TARGET_LAYOUT,
			action: WS_MSG_ACTION_UPDATE,
			payload: document.getElementById("main").innerHTML
		}
	);
}

window.saveLayout = wsSaveLayout;

export { wsLoop, wsSaveSensor };
