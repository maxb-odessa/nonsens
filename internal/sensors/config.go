package sensors

import (
	"encoding/json"
	"io/ioutil"
	"sync"

	log "nonsens/internal/logger"
)

type config struct {
	sync.Mutex
	sensors    []*Sensor
	sensorsMap map[string]*Sensor //aux for fast searches
}

func (cf *config) restore() error {
	cf.Lock()
	defer cf.Unlock()

	// read and unmarshal
	data, err := ioutil.ReadFile(configFilePath)
	if err != nil {
		return err
	}

	err = json.Unmarshal(data, &cf.sensors)
	if err != nil {
		return err
	}

	log.Info("Loaded %d sensors", len(cf.sensors))

	// make a map for fast searches
	cf.sensorsMap = make(map[string]*Sensor)
	for _, s := range cf.sensors {
		cf.sensorsMap[s.Uid] = s
	}

	return nil
}

func store(path string) error {
	// TODO
	return nil
}
