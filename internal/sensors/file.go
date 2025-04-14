package sensors

import (
	"errors"
	"io"
	"os"

	log "nonsens/internal/logger"
)

type feederFile struct {
	ioFd *os.File

	// private
	fpath     string
	keepOpen bool
}

func (f *feederFile) fd() io.ReadCloser {
	return f.ioFd
}

func (f *feederFile) path() string {
	return f.fpath
}

// ignore read timeout for files (for now)
func (f *feederFile) setup(path string, keepOpen bool, _ uint32) error {

	if path == "" {
		return errors.New("path cannot be empty")
	}

	if f.fpath != "" {
		return errors.New("path already set")
	}

	f.fpath = path

	return nil
}

func (f *feederFile) open() error {

	// feederFile is stil opened
	if f.ioFd != nil {
		// not keepopen - close it
		if !f.keepOpen {
			f.close()
		} else {
			// is keepopen - rewind it
			if _, err := f.ioFd.Seek(0, io.SeekStart); err != nil {
				// rewind faild - close and reopen it later
				log.Warn("seek() failed, closing feederFile: %s", f.fpath, err)
				f.close()
			} else {
				return nil
			}
		}
	}

	// open failure could be normal, i.e. feederFile doesn't exist yet
	if fd, err := os.Open(f.fpath); err != nil {
		log.Debug(1, "open() failed: %s", f.fpath, err)
		return err
	} else {
		f.ioFd = fd
	}

	return nil
}

func (f *feederFile) readAt(buf []byte, max int64) (int, error) {
	return f.ioFd.ReadAt(buf, max)
}

func (f *feederFile) close() {
	if f.ioFd != nil {
		f.ioFd.Close()
		f.ioFd = nil
	}
}
