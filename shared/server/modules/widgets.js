
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
	template = widget template body (html, loadef from file)
*/

async function loadWidgets() {

	// load widgets list first
	let wlObj = await fetch("./widgets/widgets.json");
	let wList = await wlObj.json();

	// fetch all widgest data from the list
	for (let i = 0; i < wList.length; i ++) {
		var wObj = await fetch("./widgets/" + wList[i].file);
		wList[i].template = await wObj.text();
		widgetsData.set(wList[i].name, wList[i].template);
	}
}

