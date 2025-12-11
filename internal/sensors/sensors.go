package sensors

import (
	"encoding/json"
	"fmt"
	"nonsens/internal/config"
	"nonsens/internal/def"
	log "nonsens/internal/logger"
	"os"
	"path/filepath"
	"sync"
)

var toServerCh chan *Sensor
var sensorsMap map[string]*Sensor
var sensorsFile string
var mutex sync.Mutex

func Start(ch chan *Sensor) error {

	// preparations
	toServerCh = ch
	sensorsMap = make(map[string]*Sensor)

	// read stored sensors if we can
	sensorsFile, _ = filepath.Abs(os.ExpandEnv(def.DataDir + "/" + def.SensorsFile))
	if sData, err := config.Load(sensorsFile); err != nil {
		return err
	} else if len(sData) > 0 {
		if err = json.Unmarshal(sData, sensorsMap); err != nil {
			return fmt.Errorf("Saved sensors parse failed: %s", err)
		}
	}

	log.Info("Loaded %d stored sensors", len(sensorsMap))

	// start all sensors
	startSensors()

	return nil
}

func startSensors() {
	for uid, s := range sensorsMap {
		log.Debug(5, "going to start sensor %s", uid)
		if err := s.start(); err != nil {
			log.Warn("Sensor %s start failed: %s", uid, err)
		}
	}
}
