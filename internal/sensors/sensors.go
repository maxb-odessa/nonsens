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
		if err = json.Unmarshal(sData, &sensorsMap); err != nil {
			return fmt.Errorf("Saved sensors parse failed: %s", err)
		}
	}

	log.Info("Loaded %d stored sensors", len(sensorsMap))

	// start all sensors
	startAllSensors()

	return nil
}

// start all configured sensors
func startAllSensors() {
	for uid, s := range sensorsMap {
		log.Debug(5, "going to start sensor %s", uid)
		if err := s.start(); err != nil {
			log.Warn("Sensor '%s' start failed: %s", uid, err)
		}
	}
}

// save all configured sensors
func saveAllSensors() {
	if jsens, err := json.Marshal(sensorsMap); err != nil {
		log.Err("sensorsMap[] to JSON failed: %s", err)
	} else {
		config.Save(sensorsFile, jsens)
		log.Info("Saved %d configured sensors", len(sensorsMap))
	}
}

// add new sensor and start it
func Add(id string, data string) {
	mutex.Lock()
	defer mutex.Unlock()

	// see if the sensor already exists
	if _, ok := sensorsMap[id]; ok {
		log.Warn("Can not add new sensor '%s': already exists", id)
		return
	}

	// create new sensor
	sens := new(Sensor)

	// sensor Config section is exactly the same as passed by remote client but in JSON format
	if err := json.Unmarshal([]byte(data), &sens.Config); err != nil {
		log.Err("Failed to parse new sensor Config data: %s", err)
		return
	}

	// add new sensor to sensors map
	sens.Uid = id
	sensorsMap[id] = sens

	// try to start the sensor; it is OK if failed
	if err := sens.start(); err != nil {
		log.Warn("Sensor '%s' start failed: %s", id, err)
	}

	// save configured sensors
	saveAllSensors()
}

// stop and delete the sensors
func Delete(id string) {
	mutex.Lock()
	defer mutex.Unlock()

	// see if the sensor exists
	if sens, ok := sensorsMap[id]; !ok {
		log.Warn("Can not delete sensor '%s': not found", id)
		return
	} else {

		// stop the sensor
		sens.stop()
		// delete it
		delete(sensorsMap, id)
		// save all sensors
		saveAllSensors()
	}
}

// update the sensor with new data from remote client
func Update(id string, data string) {
	mutex.Lock()
	defer mutex.Unlock()

	// see if the sensor exists
	var sens *Sensor
	var ok bool
	if sens, ok = sensorsMap[id]; !ok {
		log.Warn("Can not update sensor '%s': not found", id)
		return
	}

	// stop the sensor
	sens.stop()

	// sensor Config section is exactly the same as passed by remote client but in JSON format
	if err := json.Unmarshal([]byte(data), &sens.Config); err != nil {
		log.Err("Failed to parse new sensor Config data: %s", err)
		return
	}

	// try to start the sensor; it is OK if failed
	if err := sens.start(); err != nil {
		log.Warn("Sensor '%s' start failed: %s", id, err)
	}

	// save configured sensors
	saveAllSensors()
}
