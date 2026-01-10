
import { createUUID, safeString, maskBelow, showEditor } from './utils.js';
import { wsSaveSensor } from './ws.js'

export var selectedGroupId = "";

var newGroupSeq = 0;

// save clicked (last used) group id (uhm...)
function saveGroupId(id) {
	selectedGroupId = id;
	return true;
}

window.saveGroupId = saveGroupId;

// get all custom group styles names (classes) from loaded CSS file
// see nonsens.css
// and styles/groups.css
// TODO optimize: make function like getStylesForContainer('group-container'), use it for sensors too
function groupGetCustomStyles() {
	// 0 - top css file (nonsens.css)
	// 0 - second inluded file (styles/groups.css)
	// 0 - first class selector inside groups.css file (.group-container)
	// all custom classes are inside .group-container and start with '&.[A-Z]'
	const rules = document.styleSheets[0].cssRules[0].styleSheet.cssRules[0].cssRules;
	var styles = [];

	for (let i = 0; i < rules.length; i ++) {
		if (rules[i] && rules[i].selectorText.match(/^&\.[A-Z]/)) {
			styles.push(rules[i].selectorText.split(".")[1]);
		}
	}

	return styles;
}

var customGroupStyles = groupGetCustomStyles();


// generate new group html code and insert it
function groupAdd(containerId) {

	// group template
	var uuid = createUUID();
	const template = 
		`<fieldset id="gc-${uuid}" class="group-container Default">
			<legend id="gt-${uuid}" data-menu="group-menu" class="drag-handle group-legend" onclick="saveGroupId('${uuid}');">New Group #${newGroupSeq}</legend>
			<div id="g-${uuid}" class="group"></div>
			<div class="resize-handle">&nbsp;</div>
		</fieldset>`;
	newGroupSeq ++;

	document.getElementById(containerId).innerHTML += template;

	// save layout
	saveLayout();
}


// edit the group
function groupEdit(editorId) {

	var editor = document.getElementById(editorId);
	var groupC = document.getElementById("gc-"+selectedGroupId); // group container
	var groupT = groupC.querySelector("#gt-"+selectedGroupId); // group title
	var group = groupC.querySelector("#g-"+selectedGroupId);  // group itself

	// fill in editor with current group data

	var edStyles = editor.querySelector("#group-edit-style");
	// populate with available styles
	edStyles.innerHTML = "";
	for (let i = 0; i < customGroupStyles.length; i ++) {
		var style = customGroupStyles[i];
		edStyles.innerHTML += `<option value="${style}">${style}</option>`;
	}
	// set current style
	edStyles.value = groupC.className.split(" ")[1];

	editor.querySelector("#group-edit-title").value = safeString(groupT.innerHTML, false);

	var titleStyle = window.getComputedStyle(groupT);
	editor.querySelector("#group-edit-title-color").value = titleStyle.color;
	editor.querySelector("#group-edit-title-bg-color").value = titleStyle.backgroundColor;

	var groupStyle = window.getComputedStyle(group);
	editor.querySelector("#group-edit-bg-color").value = groupC.style.backgroundColor;

	// show editor
	showEditor(editorId, true);
}

// apply group params from editor
function groupApply(editorId) {

	var editor = document.getElementById(editorId);
	var groupC = document.getElementById("gc-"+selectedGroupId);
	var groupT = groupC.querySelector("#gt-"+selectedGroupId);
	var group = groupC.querySelector("#g-"+selectedGroupId);

	var oldStyle = groupC.className.split(" ")[1];
	groupC.classList.replace(oldStyle, editor.querySelector("#group-edit-style").value);

	groupT.innerHTML = safeString(editor.querySelector("#group-edit-title").value, true);

	groupT.style.color = editor.querySelector("#group-edit-title-color").value;
	groupT.style.backgroundColor = editor.querySelector("#group-edit-title-bg-color").value;

	groupC.style.backgroundColor = editor.querySelector("#group-edit-bg-color").value;

	// save layout
	saveLayout();
}

// delete a group
function groupDelete() {

	var groupC = document.getElementById("gc-"+selectedGroupId);
	var group = groupC.querySelector("#g-"+selectedGroupId);

	// delete the group and all its sensors?
	if (! confirm("You are going to DELETE the group and all its sensors!\nConfirm?")) {
		return;
	}

	// delete all groups sensors (serverside)
	var sensors = group.children;
	for (let i = 0; i < sensors.length; i ++) {
		// here 'children' are sensor containers; we should 'compose' real sensor ids out of them
		wsSaveSensor(sensors[i].id.replace(/^sc-/, "s-"), "", "delete");
	}

	// delete whole group container
	document.getElementById("gc-"+selectedGroupId).remove();

	// save layout
	saveLayout();

}

window.groupAdd = groupAdd;
window.groupEdit = groupEdit;
window.groupDelete = groupDelete;
window.groupApply = groupApply;

