package sensors

import (
	"nonsens/internal/def"
	log "nonsens/internal/logger"

	"os"
	"path/filepath"
)

var sensorsData *configData
var sensorsChan chan *Sensor

func Start(ch chan *Sensor) error {

	// prepare config storage
	sensorsData = &configData{
		Sensors: make(map[string]*Sensor),
		Groups:  make(map[string]*Group),
	}

	// read config
	configPath, _ = filepath.Abs(os.ExpandEnv(def.DataDir + "/" + def.ConfigFile))
	if err := configLoad(configPath, sensorsData); err != nil {
		return err
	}
	//ttt()
	sensorsChan = ch

	// start all sensors
	startSensors(sensorsData)

	return nil
}

func startSensors(conf *configData) {
	for uid, s := range conf.Sensors {
		log.Debug(5, "will start sensor %s", uid)
		if err := s.setup(); err == nil {
			s.start()
		} else {
			log.Warn("Sensor %s setup failed: %s", uid, err)
		}
	}
}

func ttt() {

	s := new(Sensor)
	s.Uid = "123"
	g := new(Group)
	g.Uid = "4321"

	sensorsData.Sensors["123"] = s
	sensorsData.Groups["4321"] = g

	configSave(configPath, sensorsData)
}
