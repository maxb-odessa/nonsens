package server

import (
	"fmt"
	"nonsens/internal/bcast"
	"nonsens/internal/server/templates"
)

func Run() error {

	// load templates
	if err := templates.Load(); err != nil {
		return fmt.Errorf("failed to load templates: %s", err)
	}

	// load index, js and css files

	_ = new(bcast.Bcast)

	// start reading sensors
	return nil
}
