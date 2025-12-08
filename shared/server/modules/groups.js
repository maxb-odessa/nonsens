
import { createUUID, safeString, maskBelow, showEditor } from './utils.js';

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
	const template = `
		<fieldset id="gc-${uuid}" class="group-container Default">
			<legend id="gt-${uuid}" class="drag-handle group-legend">New Group #${newGroupSeq}</legend>
			<div id="g-${uuid}" title="Click for group menu" class="group" onclick="saveGroupId('${uuid}');"></div>
			<div class="resize-handle">&nbsp;</div>
		</fieldset>
	`;
	newGroupSeq ++;

	document.getElementById(containerId).innerHTML += template;

	return true;
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
	editor.querySelector("#group-edit-bg-color").value = groupStyle.backgroundColor;

	// show editor
	showEditor(editorId, true);

	return true;
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

	group.style.backgroundColor = editor.querySelector("#group-edit-bg-color").value;

	return true;
}

// delete a group
function groupDelete() {

	// delete the group
	if (confirm("You are going to DELETE the group and all its sensors!\nConfirm?")) {
		// delete whole group container
		document.getElementById("gc-"+selectedGroupId).remove();
	}

}

export { groupAdd, groupEdit, groupDelete, groupApply };

