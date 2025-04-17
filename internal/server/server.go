package server

import (
	"fmt"
	"nonsens/internal/def"
	"nonsens/internal/templates"
)

func Run() error {

	// load templates
	if err := templates.Load(def.DataDir + def.TemplatesDir); err != nil {
		return fmt.Errorf("failed to load templates: %s", err)
	}

	// load index, js and css files
	return nil
}
