package server

import (
	"fmt"
	"nonsens/internal/templates"
)

func Run(listenAt, dataDir string) error {

	// load templates
	if err := templates.Load(dataDir); err != nil {
		return fmt.Errorf("failed to load templates: %s", err)
	}

	// load index, js and css files
	return nil
}
