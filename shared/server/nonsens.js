
import './modules/mouse.js';
import './modules/menus.js';
import './modules/groups.js';
import './modules/sensors.js';
import { wsLoop } from './modules/ws.js';


document.addEventListener('readystatechange', event => {
	if (event.target.readyState === "complete") {
		wsLoop();
	}
});
