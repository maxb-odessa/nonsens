package utils

// Package utils provides various useful functions
import (
	"html"
	"os"
	"path/filepath"
	"strings"
)

// TODO: see https://pkg.go.dev/github.com/google/safehtml#HTML
func SafeHTML(s string) string {
	// TODO replace also: \ < > ; " ' `
	return strings.ReplaceAll(html.EscapeString(s), " ", "&nbsp;")
}

func IsDir(dir string) bool {
	realDir, _ := filepath.Abs(dir)
	if stat, err := os.Stat(realDir); err == nil {
		return stat.IsDir()
	}
	return false
}

func IsFile(path string) bool {
	realPath, _ := filepath.Abs(path)
	if stat, err := os.Stat(realPath); err == nil {
		return stat.Mode().IsRegular()
	}

	return false
}
