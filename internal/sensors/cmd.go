package sensors

import (
	"context"
	"errors"
	"io"
	"nonsens/internal/def"
	"os/exec"
	"strings"
	"time"
)

type feederCmd struct {
	ioFd io.ReadCloser

	// private
	pathArgs  []string
	keepOpen bool
	timeout   uint32

	// command execution related
	ctx        context.Context
	cancelFunc context.CancelFunc
	cmd        *exec.Cmd
}

func (f *feederCmd) fd() io.ReadCloser {
	return f.ioFd
}

func (f *feederCmd) path() string {
	return f.pathArgs[0]
}

func (f *feederCmd) setup(path string, _ bool, timeout uint32) error {

	if path == "" {
		return errors.New("path cannot be empty")
	}

	if len(f.pathArgs) > 0 {
		return errors.New("path already set")
	}

	if timeout < def.SensorMinPollInterval {
		return errors.New("invalid timeout value")
	}

	// split cmd and args
	f.pathArgs = strings.Fields(path)

	f.timeout = timeout

	f.ctx, f.cancelFunc = context.WithTimeout(context.Background(), time.Duration(f.timeout)*time.Millisecond)

	f.cmd = exec.CommandContext(f.ctx, f.pathArgs[0], f.pathArgs[1:]...)

	if fd, err := f.cmd.StdoutPipe(); err != nil {
		return err
	} else {
		f.ioFd = fd
	}

	return nil
}

func (f *feederCmd) open() error {
	return f.cmd.Start() // this will actualy execute a command and start feeding f.ioFd
}

func (f *feederCmd) readAt(buf []byte, max int64) (int, error) {

	// read f.ioFd here

	// to implement
	return 0, nil
}

// kill, cleanup, etc
func (f *feederCmd) close() {
	f.cancelFunc()
	f.cmd.Wait()
}
