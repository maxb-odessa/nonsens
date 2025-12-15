
// load available widgets at start
loadWidgets();

export const widgetsData = new Map();

/*
  widgets list ex:
	[
		{
			"name": "Default",
			"file": "default.html"
		},
		{
			"name": "Vertical Bar",
			"file": "vertical.html"
		}
	]

  widgetsData entry:
	name = visible name, from the list
	templateFunc = widget template body (html, loadef from file) function
*/

async function loadWidgets() {

	// load widgets list first
	let wlObj = await fetch("./widgets/widgets.json");
	let wList = await wlObj.json();

	// fetch all widgest data from the list
	for (let i = 0; i < wList.length; i ++) {

		var wObj = await fetch("./widgets/" + wList[i].file);

		var template = await wObj.text();

		var templateFunc = new Function('data', 'options', 'return ' + "`" + template + "`");

		widgetsData.set(wList[i].name, templateFunc);

	}
}

