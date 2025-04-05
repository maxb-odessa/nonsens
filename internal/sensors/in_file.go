package sensors

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"

	log "nonsens/internal/logger"
)

type inFile struct {
	path      string
	keepAlive bool
	line, pos int
	fd        *os.File
	buf       []byte
}

// path should be in form "line:position:/full/path"
// ex: 10:32:/proc/meminfo
func (in *inFile) SetPath(path string) error {
	if in.path != "" {
		return errors.New("path already set")
	}

	if path == "" {
		return errors.New("path cannot be empty")
	}

	var line, pos int
	var filePath string

	n, err := fmt.Sscanf(path, "%d:%d:%s", &line, &pos, &filePath)
	if err != nil || n != 3 || line < 0 || pos < 0 {
		return fmt.Errorf("invalid path format, expected 'line:position:/full/path': %v", err)
	}

	in.line = line
	in.pos = pos
	in.path = filePath

	return nil
}

func (in *inFile) SetKeepAlive(on bool) {
	in.keepAlive = on
}

func (in *inFile) Get() (float64, error) {

	if in.fd == nil {
		// open failure could be normal, i.e. file doesn't exist yet
		if fd, err := os.Open(in.path); err != nil {
			log.Debug(1, "open() failed: %s", in.path, err)
			return 0.0, err
		} else {
			in.fd = fd
		}
	}

	defer func() {
		if !in.keepAlive {
			in.Close()
		} else if _, err := in.fd.Seek(0, io.SeekStart); err != nil {
			log.Warn("seek() failed, closing file: %s", in.path, err)
		}
	}()

	var strValue string

	// fast and common case: data at first line
	if in.line == 0 {

		if n, err := in.fd.ReadAt(in.buf, int64(in.pos)); err != io.EOF {
			return 0.0, err
		} else if n == 0 {
			return 0.0, fmt.Errorf("empty file")
		}

		strValue = strings.TrimSpace(string(in.buf))

	} else {

		// now read file at line N and pos P
		// slowly and painfuly
		fScanner := bufio.NewScanner(in.fd)
		fScanner.Split(bufio.ScanLines)

		// skip N lines
		line := 0
		for ; line < in.line; fScanner.Scan() {
		}

		if line != in.line {
			return 0.0, fmt.Errorf("requested line %d, but only %d lines present", in.line, line)
		}

		sv := fScanner.Text()

		// get data from position P
		if len(sv) <= in.pos {
			return 0.0, fmt.Errorf("requested line position %d, but line len is %d", in.pos, len(sv))
		} else {
			strValue = sv[in.pos:]
		}

	}

	// convert read data into value
	if val, err := strconv.ParseFloat(strValue, 64); err != nil {
		return 0.0, fmt.Errorf("failed to parse file data '%s'", strValue)
	} else {
		log.Debug(1, "got value %f from '%s'", val, in.path)
		return val, nil
	}

}

func (in *inFile) Close() {
	if in.fd != nil {
		in.fd.Close()
		in.fd = nil
	}
}
