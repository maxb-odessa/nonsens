
import { createUUID, safeString, maskBelow, showEditor } from './utils.js';

export var selecteGroupId = "";

var newGroupSeq = 0;

// save clicked (last used) group id (uhm...)
function saveGroupId(id) {
	selecteGroupId = id;
	return true;
}

window.saveGroupId = saveGroupId;

// generate new group html code and insert it
function groupAdd(containerId) {

	// group template
	var uuid = createUUID();
	const template = `
		<fieldset id="gc-${uuid}" class="group-container">
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
	var groupC = document.getElementById("gc-"+selecteGroupId); // group container
	var groupT = groupC.querySelector("#gt-"+selecteGroupId); // group title
	var group = groupC.querySelector("#g-"+selecteGroupId);  // group itself

	// fill in editor with current group data
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
	var groupC = document.getElementById("gc-"+selecteGroupId);
	var groupT = groupC.querySelector("#gt-"+selecteGroupId);
	var group = groupC.querySelector("#g-"+selecteGroupId);

	// fill in editor with current group data
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
		document.getElementById("gc-"+selecteGroupId).remove();
	}

}

export { groupAdd, groupEdit, groupDelete, groupApply };

