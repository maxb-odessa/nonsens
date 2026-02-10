
import { createUUID, safeString, maskBelow, showEditor, parseColor, makeColor, getCustomStyles } from './utils.js';
import { wsSaveSensor } from './ws.js'

export var selectedGroupId = "";

var newGroupSeq = 0;

// save clicked (last used) group id (uhm...)
function saveGroupId(id) {
	selectedGroupId = id;
	return true;
}

window.saveGroupId = saveGroupId;

var customGroupStyles = getCustomStyles(".group-container");


// generate new group html code and insert it
function groupAdd(containerId) {

	// group template
	var uuid = createUUID();
	const template = 
		`<fieldset id="gc-${uuid}" class="group-container Default">`+
			`<legend id="gt-${uuid}" class="group-legend">New Group #${newGroupSeq}</legend>` +
			`<div id="g-${uuid}" class="group" data-menu="group-menu" onclick="saveGroupId('${uuid}');"></div>` +
		`</fieldset>`;
	newGroupSeq ++;

	document.getElementById(containerId).innerHTML += template;

	// get new group
	var newGroupC = document.getElementById("gc-" + uuid);
	var newGroupT = document.getElementById("gt-" + uuid);

	// indicate this group as "new"
	var randColor = "#" + Math.floor(Math.random()*16777215).toString(16);
	newGroupC.style.backgroundColor = randColor;
	newGroupT.style.backgroundColor = randColor;

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
	var titleBgColor = parseColor(titleStyle.backgroundColor);
	editor.querySelector("#group-edit-title-bg-color").value = titleBgColor.hex;
	editor.querySelector("#group-edit-title-bg-color-alpha").value = titleBgColor.a;

	var groupStyle = window.getComputedStyle(groupC);
	var groupBgColor = parseColor(groupC.style.backgroundColor);
	editor.querySelector("#group-edit-bg-color").value = groupBgColor.hex;
	editor.querySelector("#group-edit-bg-color-alpha").value = groupBgColor.a;

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

	var titleBgColor = parseColor(editor.querySelector("#group-edit-title-bg-color").value);
	titleBgColor.a = editor.querySelector("#group-edit-title-bg-color-alpha").value;
	groupT.style.backgroundColor = makeColor(titleBgColor).rgba;

	var bgColor = parseColor(editor.querySelector("#group-edit-bg-color").value);
	bgColor.a = editor.querySelector("#group-edit-bg-color-alpha").value;
	groupC.style.backgroundColor = makeColor(bgColor).rgba;

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

