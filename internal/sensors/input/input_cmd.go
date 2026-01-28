package input

import (
	"context"
	"errors"
	"io"
	"os/exec"
	"time"
)

type feederCmd struct {
	ioFd io.ReadCloser

	// private
	path     string
	keepOpen bool
	timeout  time.Duration

	// command execution related
	ctx        context.Context
	cancelFunc context.CancelFunc
	cmd        *exec.Cmd
}

/*
allow exec of only files withing shared/exec direcory
ignore cmdline ags
the dir must not have group and other write perms TODO
as well as command within the dir TODO?
path should be relative only
*/

func (f *feederCmd) fd() io.ReadCloser {
	return f.ioFd
}

func (f *feederCmd) setup(path string, _ bool, timeout time.Duration) error {

	if f.path != "" {
		return errors.New("path already set")
	}

	f.path = path

	f.timeout = timeout

	return nil
}

func (f *feederCmd) open() error {

	f.ctx, f.cancelFunc = context.WithTimeout(context.Background(), f.timeout)
	f.cmd = exec.CommandContext(f.ctx, f.path, "")

	if fd, err := f.cmd.StdoutPipe(); err != nil {
		return err
	} else {
		f.ioFd = fd
	}

	return f.cmd.Start() // this will actualy execute a command and start feeding f.ioFd
}

// kill, cleanup, etc
func (f *feederCmd) close() {
	f.cancelFunc()
	f.cmd.Wait()
}
