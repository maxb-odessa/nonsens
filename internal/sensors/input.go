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
	line, offset uint32
	path         string
	buf          []byte
}

type inputValue struct {
	val float64
	err error
}

const (
	inTypeFile = "file"
	inTypeCmd  = "cmd"
)

// path should be in form "line:offset:/full/path"
// ex: 10:32:/proc/meminfo
func (in *input) setup(path string, inType string, keepOpen bool, timeout uint32) error {

	if err := in.parsePath(path); err != nil {
		return fmt.Errorf("invalid path format, expected 'line:offset:/full/path': %v", err)
	}

	in.buf = make([]byte, 64)

	switch inType {
	case inTypeFile:
		in.feeder = new(feederFile)
	case inTypeCmd:
		in.feeder = new(feederCmd)
	default:
		return fmt.Errorf("sensor type '%s' is not implemented", inType)
	}

	in.feeder.setup(in.path, keepOpen, timeout)

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

		strValue = string(in.buf)

	} else {

		// now read file at line N and offset P
		// slowly and painfuly
		fd := in.feeder.fd()
		fScanner := bufio.NewScanner(fd)
		fScanner.Split(bufio.ScanLines)

		// skip N lines
		var line uint32
		for line = 0; line < in.line && fScanner.Scan(); line++ {
		}

		if line != in.line {
			return &inputValue{err: fmt.Errorf("requested line %d, but only %d lines present", in.line, line)}
		}

		sv := fScanner.Text()

		// get data from offset P
		if len(sv) <= int(in.offset) {
			return &inputValue{err: fmt.Errorf("requested line offset %d, but line len is %d", in.offset, len(sv))}
		} else {
			strValue = sv[in.offset:]
		}

	}

	// convert read data into value
	//if val, err := strconv.ParseFloat(strValue, 64); err != nil {
	var val float64
	if n, err := fmt.Sscanf(strValue, "%32f", &val); err != nil || n != 1 {
		return &inputValue{err: fmt.Errorf("failed to parse file data '%s'", strValue)}
	} else {
		log.Debug(5, "got value %f from '%s'", val, in.path)
		return &inputValue{val: val}
	}

}

func (in *input) parsePath(path string) error {

	parts := strings.SplitN(path, ":", 3)
	if len(parts) != 3 {
		return fmt.Errorf("not enough fields")
	}

	if line, err := strconv.ParseUint(parts[0], 10, 32); err != nil {
		return fmt.Errorf("line must be uint")
	} else {
		in.line = uint32(line)
	}

	if offset, err := strconv.ParseUint(parts[1], 10, 32); err != nil {
		return fmt.Errorf("offset must be uint")
	} else {
		in.offset = uint32(offset)
	}

	in.path = parts[2]

	return nil
}
