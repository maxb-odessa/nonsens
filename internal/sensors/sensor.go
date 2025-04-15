package sensors

import (
	log "nonsens/internal/logger"
	"sync"
	"time"
)

type Sensor struct {
	// private
	sync.Mutex

	// runtime
	input                input      // sensor input interface
	prevValue, currValue inputValue // store prev and curr value
	valueDiff            float64    // diff between curr and prev: <0.0 decreasing, =0.0 steady, >0.0 rising

	// public, storable
	Uid          string  `json:"uid"`
	Type         string  `json:"type"`
	Path         string  `json:"path"`
	KeepOpen     bool    `json:"keep_open"`
	Min          float64 `json:"min"`
	Max          float64 `json:"max"`
	Divider      float64 `json:"divider"`
	PollInterval uint32  `json:"poll_interval"` // milliseconds

	Widget *Widget
}

func (s *Sensor) setup() error {
	return s.input.setup(s.Path, s.Type, s.KeepOpen, s.PollInterval)
}

func (s *Sensor) start( /* chan? */ ) error {
	for {
		v := s.input.get()
		log.Debug(9, "sensor(%s).get() => %f, %+v", s.Uid, v.val, v.err)
		time.Sleep(time.Duration(s.PollInterval) * time.Millisecond)
	}
}

func (s *Sensor) stop() error {
	return nil
}
