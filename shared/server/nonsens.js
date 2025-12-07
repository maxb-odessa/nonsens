import { dragResize } from './modules/drag-resize.js';
import { toggleMenu, showMenu } from './modules/onclick.js';
import { groupAdd, groupEdit, groupDelete, groupApply } from './modules/groups.js';
import { sensorAdd, sensorEdit, sensorDelete, sensorApply } from './modules/sensors.js';
import { wsLoop } from './modules/ws.js';


// for debug purposes: prevent CSS file caching
function loadCSS() {
	document.getElementsByTagName('head')[0].insertAdjacentHTML(
		'beforeend',
		'<link rel="stylesheet" type="text/css" href="nonsens.css?'+Date.now()+'" />'
	);
};


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

		loadCSS();

		wsLoop();
	}
});
