
function loadCSS() {
	document.getElementsByTagName('head')[0].insertAdjacentHTML(
		'beforeend',
		// for debug purposes: prevent CSS file caching
		'<link rel="stylesheet" type="text/css" href="css/nonsens.css?'+Date.now()+'" />'
	);
};


// establish websocket communication
async function wsLoop() {

	loadCSS();

	const wsUrl = "ws://" + window.location.hostname + ":" + window.location.port + "/ws";

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
			if (obj.target == 'L') {
				// update whole layout
				updateLayout(obj.payload);
			} else if (obj.target == 'S') {
				// update sensor data
				updateSensor(obj.payload);
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


// update whole groups/sensors layout
// div 'main' always exists
function updateLayout(content) {
	document.getElementById('main').innerHTML = content;
}

// update sensor data
function updateSensor(data) {
	var sensor = document.getElementById(data.id);

	// no such sensor? TODO do something!
	if (! sensor) {
		return;
	}

	// TODO redraw sensor widget according to new values

}
