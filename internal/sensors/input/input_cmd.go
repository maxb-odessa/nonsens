package input

import (
	"context"
	"errors"
	"io"
	"nonsens/internal/def"
	"os/exec"
	"time"
)

type feederCmd struct {
	ioFd io.ReadCloser

	// private
	path     string
	keepOpen bool
	timeout  uint32

	// command execution related
	ctx        context.Context
	cancelFunc context.CancelFunc
	cmd        *exec.Cmd
}

/* TODO
allow exec of only files withing shared/exec direcory
ignore cmdline ags
the dir must not have group and other write perms
as well as command within the dir
symlinks are not allowed
*/

func (f *feederCmd) fd() io.ReadCloser {
	return f.ioFd
}

func (f *feederCmd) setup(path string, _ bool, timeout uint32) error {

	if path == "" {
		return errors.New("path cannot be empty")
	}

	if len(f.path) > 0 {
		return errors.New("path already set")
	}

	if timeout < def.SensorMinPollInterval {
		return errors.New("invalid timeout value")
	}

	// split cmd and args
	f.path = path

	f.timeout = timeout

	return nil
}

func (f *feederCmd) open() error {

	f.ctx, f.cancelFunc = context.WithTimeout(context.Background(), time.Duration(f.timeout)*time.Millisecond)
	f.cmd = exec.CommandContext(f.ctx, f.path)

	if fd, err := f.cmd.StdoutPipe(); err != nil {
		return err
	} else {
		f.ioFd = fd
	}

	return f.cmd.Start() // this will actualy execute a command and start feeding f.ioFd
}

func (f *feederCmd) readAt(buf []byte, max int64) (int, error) {
	// TODO
	// read f.ioFd here

	// to implement
	return 0, nil
}

// kill, cleanup, etc
func (f *feederCmd) close() {
	f.cancelFunc()
	f.cmd.Wait()
}
