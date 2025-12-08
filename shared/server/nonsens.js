
import { dragResize } from './modules/drag-resize.js';
import { toggleMenu, showMenu } from './modules/onclick.js';
import { groupAdd, groupEdit, groupDelete, groupApply } from './modules/groups.js';
import { sensorAdd, sensorEdit, sensorDelete, sensorApply } from './modules/sensors.js';
import { wsLoop } from './modules/ws.js';


document.addEventListener('readystatechange', event => {
	if (event.target.readyState === "complete") {

		document.onmousedown = dragResize;
		document.ontouchstart = dragResize;

		window.toggleMenu = toggleMenu;
		window.showMenu = showMenu;

		window.groupAdd = groupAdd;
		window.groupEdit = groupEdit;
		window.groupDelete = groupDelete;
		window.groupApply = groupApply;

		window.sensorAdd = sensorAdd;
		window.sensorEdit = sensorEdit;
		window.sensorDelete = sensorDelete;
		window.sensorApply = sensorApply;

		wsLoop();
	}
});
