package sensors

import (
	"encoding/json"
	"errors"
	log "nonsens/internal/logger"
	"os"
	"sync"
)

var configPath string

type configData struct {
	sync.Mutex
	Sensors map[string]*Sensor
	Groups  map[string]*Group
}

// load sensors from config file
func configLoad(path string, conf *configData) error {

	conf.Lock()
	defer conf.Unlock()

	// it's ok if no config file exists yet
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		return nil
	}

	// read and unmarshal
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	err = json.Unmarshal(data, conf)
	if err != nil {
		return err
	}

	return nil
}

func configSave(path string, conf *configData) error {
	conf.Lock()
	defer conf.Unlock()

	jsConf, _ := json.MarshalIndent(conf, "", "    ")

	log.Info("Saving config to '%s'", path)
	return os.WriteFile(path, jsConf, 0644)
}
