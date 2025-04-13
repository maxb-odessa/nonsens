package sensors

import (
	"errors"
	"io"
	"os"

	log "nonsens/internal/logger"
)

type feederFile struct {
	fpath      string
	fkeepAlive bool
	ffd        *os.File
}

func (f *feederFile) fd() io.ReadCloser {
	return f.ffd
}

func (f *feederFile) path() string {
	return f.fpath
}

func (f *feederFile) setup(path string, keepAlive bool) error {

	if f.fpath != "" {
		return errors.New("path already set")
	}

	if path == "" {
		return errors.New("path cannot be empty")
	}

	f.fpath = path

	return nil
}

func (f *feederFile) open() error {

	// feederFile is stil opened
	if f.ffd != nil {
		// not keepalive - close it
		if !f.fkeepAlive {
			f.close()
		} else {
			// is keepalive - rewind it
			if _, err := f.ffd.Seek(0, io.SeekStart); err != nil {
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
		f.ffd = fd
	}

	return nil
}

func (f *feederFile) readAt(buf []byte, max int64) (int, error) {
	return f.ffd.ReadAt(buf, max)
}

func (f *feederFile) close() {
	if f.ffd != nil {
		f.ffd.Close()
		f.ffd = nil
	}
}
