package utils

// Package utils provides various useful functions
import (
	"crypto/md5"
	"fmt"
	"html"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/danwakefield/fnmatch"
)

// LoadDir loads no more than "maxNum"  files with extension "ext" of max size "maxSize" from dir "dir"
// and puts them into map "holder" using filename without extension as a key
func LoadDir(holder map[string][]byte, dir string, ext string, maxSize int64, maxNum int) error {

	absDir, _ := filepath.Abs(os.ExpandEnv(dir))

	d, err := os.Open(absDir)
	if err != nil {
		return err
	}

	defer d.Close()

	files, err := d.Readdir(0)
	if err != nil {
		return err
	}

	for _, f := range files {

		// too much files already loaded
		if len(holder) >= maxNum {
			break
		}

		// match file extension
		if !fnmatch.Match(`*`+ext, f.Name(), fnmatch.FNM_PATHNAME) {
			continue
		}

		// only regular files accepted
		if !f.Mode().IsRegular() {
			continue
		}

		// skip too bog files
		if f.Size() > maxSize {
			continue
		}

		// read the file
		path := absDir + `/` + f.Name()
		if data, err := os.ReadFile(path); err != nil {
			return err
		} else {
			// store loaded file
			noExt := strings.TrimSuffix(f.Name(), ext)
			holder[noExt] = data
		}

	}

	return nil
}

// TODO: see https://pkg.go.dev/github.com/google/safehtml#HTML
func SafeHTML(s string) string {
	// TODO replace also: \ < > ; " ' `
	return strings.ReplaceAll(html.EscapeString(s), " ", "&nbsp;")
}

func IsDir(dir string) bool {
	if stat, err := os.Stat(dir); err == nil && stat.IsDir() {
		return true
	}
	return false
}

// very simple "unique identifier" generator
func MakeUID() string {
	return fmt.Sprintf("%x", md5.Sum([]byte(time.Now().String())))
}
