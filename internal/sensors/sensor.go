package sensors

import "sync"

type input interface {
	SetPath(string) error
	SetKeepAlive(bool)
	Get() (float64, error)
	Close()
}

type inputValue struct {
	value float64
	err   error
}

type Sensor struct {
	pvt struct {
		sync.Mutex
		input input
	}

	runtime struct {
		value float64
	}

	Type      string
	Uid       string
	Path      string
	KeepAlive bool

	Min, Max     float64
	Divider      float64
	PollInterval float32

	Widget *Widget
}

func (s *Sensor) setup() error {
	switch s.Type {
	case "file":
		s.pvt.input = new(inFile)
	case "cmd":
		s.pvt.input = new(inCmd)
	}

	s.pvt.input.SetPath(s.Path)
	s.pvt.input.SetKeepAlive(s.KeepAlive)

	return nil
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
