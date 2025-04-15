// Package sensors provides sensor data
package sensors

import (
	"nonsens/internal/def"
	log "nonsens/internal/logger"
)

var configFilePath string

func Run(dataDir string) error {
	configFilePath = dataDir + def.SensorsConfigFile

	conf := new(config)

	if err := conf.restore(); err != nil {
		return err
	}

	return startAll(conf)
}

func startAll(cf *config) error {
	for _, s := range cf.sensors {
		if err := s.setup(); err != nil {
			log.Warn("sensor '%s' setup failed: %s", s.Uid, err)
		} else {
			log.Info("starting sensor '%s'", s.Uid)
			go s.start()
		}
	}

	return nil
}
