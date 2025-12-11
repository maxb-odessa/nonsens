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
	}

	// read config
	configPath, _ = filepath.Abs(os.ExpandEnv(def.DataDir + "/" + def.ConfigFile))
	if err := configLoad(configPath, sensorsData); err != nil {
		return err
	}

	sensorsChan = ch

	// start all sensors
	startSensors(sensorsData)

	return nil
}

func startSensors(conf *configData) {
	for uid, s := range conf.Sensors {
		log.Debug(5, "will start sensor %s", uid)
		if err := s.start(); err != nil {
			log.Warn("Sensor %s start failed: %s", uid, err)
		}
	}
}

func LockAll() {
	sensorsData.Lock()
}

func UnlockAll() {
	sensorsData.Unlock()
}

func GetAllSensors() map[string]*Sensor {
	return sensorsData.Sensors
}
