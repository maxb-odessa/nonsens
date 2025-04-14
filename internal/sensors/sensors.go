// Package sensors provides sensor data
package sensors

import "nonsens/internal/def"

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
	return nil
}
