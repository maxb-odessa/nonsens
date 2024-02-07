package server

import (
	"encoding/json"

	"github.com/maxb-odessa/nonsens/internal/sensors"
	"github.com/maxb-odessa/nonsens/internal/sensors/sensor"
	"github.com/maxb-odessa/nonsens/internal/utils"
	"github.com/maxb-odessa/slog"
)

type SensorData struct {
	ToTop   bool           `json:"totop"`
	GroupId string         `json:"groupid"`
	Sensor  *sensor.Sensor `json:"sensor"`
}

type GroupData struct {
	Name   string `json:"name"`
	Column int    `json:"column"`
	ToTop  bool   `json:"totop"`
}

type FeedbackMsg struct {
	Action string      `json:"action"` // what to do: appply, save, show disabled, etc.
	Id     string      `json:"id"`     // taget id, group or sensor
	Sensor *SensorData `json:"sensor"`
	Group  *GroupData  `json:"group"`
}

func processFeedback(data []byte) {
	var msg FeedbackMsg
	needRefresh := false

	err := json.Unmarshal(data, &msg)
	if err != nil {
		slog.Err("failed to unmarshal feedback json: %s", err)
		return
	}
	slog.Info("GOT: %+v", msg)

	// modify sensor
	if msg.Sensor != nil {
		needRefresh = modifySensor(msg.Id, msg.Action, msg.Sensor)
	} else if msg.Group != nil {
		needRefresh = modifyGroup(msg.Id, msg.Action, msg.Group)
	} else {
		switch msg.Action {
		case "save":
			if err := conf.Save(); err != nil {
				slog.Err("Config file save failed: %s", err)
			}
		case "rescan":
			// TODO rescan all sensors
		case "reload":
			// TODO reload config
		case "new":
			// new sensor, also make a group for it
		default:
			slog.Err("undefined feedback action '%s'", msg.Action)
			return
		}
	}

	// rebuild the body and refresh it
	if needRefresh {
		// delete all empty columns, etc
		conf.Sanitize()
		makeBody()
		sendBody()
	}

}

func modifySensor(id string, action string, sData *SensorData) bool {
	var needReconfig bool

	gr, se := conf.FindSensorById(id)
	if se == nil {
		slog.Warn("sensor id '%s' not found", id)
		return false
	}

	// assume the sensor is always modified

	if action == "remove" {
		se.Stop()
		conf.RemoveSensor(se)
		slog.Info("Removed sensor '%s' '%s' '%s'", se.Name, se.Options.Device, se.Options.Input)
		return true
	}

	se.Lock()
	defer se.Unlock()

	if action == "new" {
		// TODO add new sensor
	}

	// device or input file changed - reconfig sensors
	if se.Options.Device != sData.Sensor.Options.Device || se.Options.Input != sData.Sensor.Options.Input {
		needReconfig = true
	}

	se.Name = utils.SafeHTML(sData.Sensor.Name)
	//se.Name = sData.Sensor.Name

	se.Options = sData.Sensor.Options
	se.Widget = sData.Sensor.Widget

	// group changed
	if gr.Id() != sData.GroupId {
		conf.MoveSensorToGroup(se, gr, sData.GroupId)
	}

	// move sensor to group top
	if sData.ToTop {
		conf.MoveSensorToGroupTop(se)
	}

	se.Stop()

	if needReconfig {
		sensors.SetupSensor(se)
	}

	se.Start(sensors.Chan())

	return true
}

func modifyGroup(id string, action string, gData *GroupData) bool {
	modified := false

	ci, _, gr := conf.FindGroupById(id)
	if gr == nil {
		slog.Warn("group '%s' not found", id)
		return false
	}

	if action == "remove" {
		if len(gr.Sensors) == 0 {
			conf.RemoveGroup(gr)
			slog.Info("Removed empty group '%s'", gr.Name)
			return true
		}
		return false
	}

	// name changed
	if gr.Name != gData.Name {
		gr.Name = utils.SafeHTML(gData.Name)
		modified = true
	}

	// column changed
	if ci != gData.Column {

		// remove from old column
		conf.RemoveGroup(gr)

		// create new column if missed
		for gData.Column > len(conf.Columns)-1 {
			conf.AddColumn()
			// columns must be monotonic, don't allow change column from 1 to 7, but from 3 to 4 is ok
			gData.Column = len(conf.Columns) - 1
		}

		// add to new column
		conf.AddGroup(gData.Column, gr)

		modified = true
	}

	// move this group to column top
	if gData.ToTop {
		if conf.MoveGroupToTop(id) {
			modified = true
		}
	}

	return modified
}
