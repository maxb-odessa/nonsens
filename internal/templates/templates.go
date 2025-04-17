// Package templates loads all available template files and provides access to loaded data
package templates

import (
	"bytes"
	"errors"
	"text/template"

	log "nonsens/internal/logger"
	"nonsens/internal/utils"
)

type Tmpl *template.Template

var loadedTemplates map[string]Tmpl

// Init loads all template files
func Load(templatesDir string) error {

	files := make(map[string][]byte)

	// precaution: load no more than 64 files max 64k bytes each
	if err := utils.LoadDir(files, templatesDir, ".tmpl", 64*1024, 64); err != nil {
		return err
	}

	if len(files) == 0 {
		return errors.New("No HTML templates loaded")
	}

	loadedTemplates = make(map[string]Tmpl, 0)

	for name, tmpl := range files {
		if t, err := template.New(name).Parse(string(tmpl)); err != nil {
			return err
		} else {
			loadedTemplates[name] = t
			log.Debug(1, "loaded temlpate '%s'", name)
		}
	}

	return nil
}

// Apply applies provided data to template
func Apply(tmpl Tmpl, data interface{}) (string, error) {
	result := ""

	var buf bytes.Buffer
	t := template.Template(*tmpl)
	if err := t.Execute(&buf, data); err != nil {
		return "", err
	} else {
		result = buf.String()
		// result = strings.ReplaceAll(buf.String(), "\n", "")
		// result = template.HTML(res)
		log.Debug(9, "string after templating: '%s'", result)
	}

	return result, nil
}

// ApplyByName applies provided data to named template
func ApplyByName(name string, data interface{}) (string, error) {
	if tmpl, ok := loadedTemplates[name]; ok {
		return Apply(tmpl, data)
	}
	return "", errors.New("template is not loaded")
}
