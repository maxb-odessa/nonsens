package sensors

import (
	"bufio"
	"fmt"
	"io"
	"strconv"
	"strings"

	log "nonsens/internal/logger"
)

type feeder interface {
	setup(string, bool, uint32) error
	open() error
	readAt([]byte, int64) (int, error)
	close()
	fd() io.ReadCloser
	path() string
}

type input struct {
	feeder       feeder
	line, offset int
	buf          []byte
}

type inputValue struct {
	val float64
	err error
}

const (
	inTypeFile = "file"
	inTypeCmd  = "string"
)

// path should be in form "line:offset:/full/path"
// ex: 10:32:/proc/meminfo
func (in *input) setup(path string, inType string, keepOpen bool, timeout uint32) error {

	var line, offset int
	var filePath string

	n, err := fmt.Sscanf(path, "%d:%d:%s", &line, &offset, &filePath)
	if err != nil || n != 3 || line < 0 || offset < 0 || filePath[0] != '/' {
		return fmt.Errorf("invalid path format, expected 'line:offset:/full/path': %v", err)
	}

	in.line = line
	in.offset = offset
	in.buf = make([]byte, 64)

	switch inType {
	case inTypeFile:
		in.feeder = new(feederFile)
	case inTypeCmd:
		in.feeder = new(feederCmd)
	default:
		return fmt.Errorf("sensor type '%s' is not implemented", inType)
	}

	in.feeder.setup(path, keepOpen, timeout)

	return nil
}

func (in *input) get() *inputValue {

	// (re)open file or exec command
	if err := in.feeder.open(); err != nil {
		return &inputValue{err: err}
	}

	defer in.feeder.close()

	var strValue string

	// fast and common case: data is at first line
	if in.line == 0 {

		if n, err := in.feeder.readAt(in.buf, int64(in.offset)); err != io.EOF {
			return &inputValue{err: err}
		} else if n == 0 {
			return &inputValue{err: fmt.Errorf("empty file")}
		}

		strValue = strings.TrimSpace(string(in.buf))

	} else {

		// now read file at line N and offset P
		// slowly and painfuly
		fd := in.feeder.fd()
		fScanner := bufio.NewScanner(fd)
		fScanner.Split(bufio.ScanLines)

		// skip N lines
		line := 0
		for ; line < in.line; fScanner.Scan() {
		}

		if line != in.line {
			return &inputValue{err: fmt.Errorf("requested line %d, but only %d lines present", in.line, line)}
		}

		sv := fScanner.Text()

		// get data from offset P
		if len(sv) <= in.offset {
			return &inputValue{err: fmt.Errorf("requested line offset %d, but line len is %d", in.offset, len(sv))}
		} else {
			strValue = sv[in.offset:]
		}

	}

	// convert read data into value
	if val, err := strconv.ParseFloat(strValue, 64); err != nil {
		return &inputValue{err: fmt.Errorf("failed to parse file data '%s'", strValue)}
	} else {
		log.Debug(1, "got value %f from '%s'", val, feeder.path)
		return &inputValue{val: val}
	}

}
