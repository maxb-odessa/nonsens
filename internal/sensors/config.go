package config

import (
	"encoding/json"
	"errors"
	"os"
	"sync"
)

type Config any

var mutex sync.Mutex

func Read(path string, data any) error {
	mutex.Lock()
	defer mutex.Unlock()

	// it's ok if no config file exists yet
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		return nil
	}

	// read and unmarshal
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	err = json.Unmarshal(data, &Config)
	if err != nil {
		return err
	}

	return nil
}

func Save(path string) error {
	mutex.Lock()
	defer mutex.Unlock()

	return nil
}

func WriteLock() {
	mutex.RWLock()
}

func WriteUnlock() {
	mutex.RWUnlock()
}
