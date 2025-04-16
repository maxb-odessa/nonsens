// Package sensors provides sensor data
package sensors

import (
	"nonsens/internal/def"
	log "nonsens/internal/logger"
)

var configFilePath string

var (
	SensorsDataCh chan *SensorData
)

func init() {
	SensorsDataCh = make(chan *SensorData, 32)
}

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
			s.start(SensorsDataCh)
		}
	}

	return nil
}
