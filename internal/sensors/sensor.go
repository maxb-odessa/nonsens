package sensors

import "sync"

type Sensor struct {
	// private
	sync.Mutex

	input input

	// runtime
	value [2]inputValue // store prev and curr value

	// public, storable
	Uid string

	Type      string
	Path      string
	KeepAlive bool

	Min, Max     float64
	Divider      float64
	PollInterval float32

	Widget *Widget
}

func (s *Sensor) setup() error {
	return s.input.setup(s.Path, s.Type, s.KeepAlive)
}

func (s *Sensor) read() error {
	return nil
}

func (s *Sensor) start( /* chan? */ ) error {
	return nil
}

func (s *Sensor) stop() error {
	return nil
}
