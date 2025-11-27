
// debug purposes: prevent CSS file caching
function loadCSS() {
	document.getElementsByTagName('head')[0].insertAdjacentHTML(
		'beforeend',
		'<link rel="stylesheet" type="text/css" href="css/nonsens.css?'+Date.now()+'" />'
	);
};


// establish websocket communication
async function wsLoop() {

	loadCSS();

	const wsUrl = "ws://" + window.location.hostname + ":" + window.location.port + "/ws";

	while (1) {

		let reconnect = false;

		wsocket = {};
		wsocket = new WebSocket(wsUrl);

		wsocket.onopen = function() {
			reconnect = false;
		};

		wsocket.onmessage = function(msg) {
			const obj = JSON.parse(msg.data);
			let target = obj.target;
			let data = obj.data;
			let output = document.getElementById(target);
			if (output !== null) {
				output.innerHTML = data;
			}
		};

		wsocket.onerror = function(ev) {
			reconnect = true;
		}

		wsocket.onclose = function(ev) {
			reconnect = true;
		};

		await waitUntil(() => reconnect === true);

	};

};

async function waitUntil(condition, time = 1000) {
	while (!condition()) {
		await new Promise((resolve) => setTimeout(resolve, time));
	}
}

