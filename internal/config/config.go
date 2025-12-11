package config

import (
	"errors"
	"os"
	"sync"
)

var mutex sync.Mutex

func Load(path string) ([]byte, error) {

	mutex.Lock()
	defer mutex.Unlock()

	// it's ok if no config file exists yet
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}

	// read and return
	if data, err := os.ReadFile(path); err != nil {
		return data, err
	} else {
		return data, nil
	}
}

func Save(path string, data []byte) error {
	mutex.Lock()
	defer mutex.Unlock()

	return os.WriteFile(path, data, 0644)
}
