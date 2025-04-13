package sensors

import (
	"errors"
	"io"
)

type feederCmd struct {
	fpath      string
	fkeepAlive bool
	ffd        io.ReadCloser
}

func (f *feederCmd) fd() io.ReadCloser {
	return f.ffd
}

func (f *feederCmd) path() string {
	return f.fpath
}

func (f *feederCmd) setup(path string, keepAlive bool) error {

	if f.fpath != "" {
		return errors.New("path already set")
	}

	if path == "" {
		return errors.New("path cannot be empty")
	}

	f.fpath = path

	return nil
}

func (f *feederCmd) open() error {

	// exec with timeout, setup, etc
	// keepAlive id not applicable here

	return nil
}

func (f *feederCmd) readAt(buf []byte, max int64) (int, error) {
	// to implement
	return 0, nil
}

func (f *feederCmd) close() {
	// kill, cleanup, etc
}
