package input

import (
	"bufio"
	"fmt"
	"io"
	"nonsens/internal/def"
	"strconv"
	"strings"
	"time"
)

type feeder interface {
	setup(string, bool, time.Duration) error
	open() error
	close()
	fd() io.ReadCloser
}

type Input struct {
	feeder    feeder
	line, pos uint32
	path      string
	buf       []byte
}

type InputValue struct {
	Val float64
	Err error
}

const (
	inTypeFile = "file"
	inTypeCmd  = "cmd"
)

// path should be in form "line:pos:/full/path"
// or for cmd: 1:2:cmdfile.sh
// where line = line starting from 0, pos = field position starting with 0, \s+ is a delimiter
// ex: 10:2:/proc/meminfo
func (in *Input) Setup(path string, inType string, keepOpen bool, timeout time.Duration) error {

	if err := in.parsePath(path); err != nil {
		return fmt.Errorf("invalid path format, expected 'line:pos:/full/path': %v", err)
	}

	if timeout < def.SensorMinPollInterval {
		timeout = def.SensorMinPollInterval
	}

	in.buf = make([]byte, 64)

	switch inType {
	case inTypeFile:
		in.feeder = new(feederFile)
	case inTypeCmd:
		// adjust cmd path
		//in.path = def.DataDir + def.CmdDir + "/" + in.path
		in.feeder = new(feederCmd)
	default:
		return fmt.Errorf("sensor type '%s' is not implemented", inType)
	}

	return in.feeder.setup(in.path, keepOpen, timeout)
}

func (in *Input) Get() *InputValue {

	// (re)open file or exec command
	if err := in.feeder.open(); err != nil {
		return &InputValue{Err: err}
	}

	fd := in.feeder.fd()
	defer in.feeder.close()

	var strValue string

	// fast and common case: data is at first line and at first position
	if in.line == 0 && in.pos == 0 {
		if n, err := fd.Read(in.buf); err != nil && err != io.EOF {
			return &InputValue{Err: err}
		} else if n == 0 {
			return &InputValue{Err: fmt.Errorf("empty file")}
		}

		strValue = string(in.buf)

	} else {

		// now read file at line N and pos P
		// slowly and painfuly
		fScanner := bufio.NewScanner(fd)
		fScanner.Split(bufio.ScanLines)

		// skip N lines
		var line uint32
		for line = 0; line < in.line && fScanner.Scan(); line++ {
		}

		if line != in.line {
			return &InputValue{Err: fmt.Errorf("requested line %d, but only %d lines present", in.line, line)}
		}

		strValue = fScanner.Text()
	}

	// get data from pos P
	fields := strings.Fields(strValue)
	if len(fields) < int(in.pos) {
		return &InputValue{Err: fmt.Errorf("requested line pos %d, but only %d positions present", in.pos, len(fields))}
	} else {
		// reuse the var
		strValue = fields[in.pos]
	}

	// convert read data into value
	//if val, err := strconv.ParseFloat(strValue, 64); err != nil {
	var val float64
	if n, err := fmt.Sscanf(strValue, "%32f", &val); err != nil || n != 1 {
		return &InputValue{Err: fmt.Errorf("failed to parse file data '%s'", strValue)}
	} else {
		return &InputValue{Val: val}
	}

}

func (in *Input) Close() {
	in.feeder.close()
}

func (in *Input) parsePath(path string) error {

	parts := strings.SplitN(path, ":", 3)
	if len(parts) != 3 {
		return fmt.Errorf("not enough fields")
	}

	if line, err := strconv.ParseUint(parts[0], 10, 32); err != nil {
		return fmt.Errorf("line must be uint")
	} else {
		in.line = uint32(line)
	}

	if pos, err := strconv.ParseUint(parts[1], 10, 32); err != nil {
		return fmt.Errorf("position must be uint")
	} else {
		in.pos = uint32(pos)
	}

	in.path = parts[2]

	return nil
}
