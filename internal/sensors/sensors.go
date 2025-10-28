package sensors

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"nonsens/internal/config"
	log "nonsens/internal/logger"
	"nonsens/internal/sensors/input"
	"sync"
)

// this will be sent to webserver
type SensorData struct {
	Value, Diff float64
	Percents    uint
	Online      bool
}

type Sensor struct {
	// private
	sync.Mutex
	doneCh     chan bool
	cancelFunc func()

	// runtime
	input input.Input          // sensor input interface
	value [2]*input.InputValue // store prev and curr value
	data  SensorData           // this will be reported to web server

	// calculated
	maxMinDiff float64 // (Max-Min)/100 for faster percents calculation

	// public, storable
	Uid          string  `json:"uid"`           // uniq sensor id, will be generated if new
	Type         string  `json:"type"`          // "file" or "cmd"
	Path         string  `json:"path"`          // full path to file or command
	KeepOpen     bool    `json:"keep_open"`     // for files: keep it for readings
	Min          float64 `json:"min"`           // min input value, divider applied
	Max          float64 `json:"max"`           // max input value, divider applied
	Divider      float64 `json:"divider"`       // input value divider (can be negaive)
	PollInterval uint32  `json:"poll_interval"` // milliseconds

	Widget Widget
}

func (s *Sensor) setup() error {

	s.Lock()
	defer s.Unlock()

	// invalid min/max range
	if s.Min >= s.Max {
		return fmt.Errorf("Min value >= Max value")
	}

	s.maxMinDiff = (s.Max - s.Min) / 100.0

	// invalid divider
	if s.Divider == 0.0 {
		return fmt.Errorf("Divider can not be zero")
	}

	// do not allow too small poll interval
	/*if s.PollInterval < def.SensorMinPollInterval {
		return fmt.Errorf("Poll interval is too small")
	}*/

	// generate new uid if not set
	if s.Uid == "" {
		s.Uid = uuid.New().String()
	}

	s.value = [2]*input.InputValue{{}, {}}

	s.doneCh = make(chan bool)

	// create sensor input
	return s.input.Setup(s.Path, s.Type, s.KeepOpen, s.PollInterval)
}

func (s *Sensor) start(outCh chan *SensorData) error {

	getReadings := func() {
		s.Lock()
		defer func() {
			log.Debug(0, "data = %+v", s.data)
			select {
			case outCh <- &s.data:
			default:
				log.Debug(1, "sensors data queue is full, discarding sensor data")
			}
			s.Unlock()
		}()

		// move prev value
		s.value[1] = s.value[0]

		// get new value
		s.value[0] = s.input.Get()
		log.Debug(9, "sensor(%s).get() => %f, %v", s.Path, s.value[0].Val, s.value[0].Err)

		s.data.Online = s.value[0].Err == nil

		// sensor if offline - we're done here
		if !s.data.Online {
			return
		}

		// if no errors: store new value and calc diff
		s.data.Value = s.value[0].Val / s.Divider
		if s.value[1].Err == nil {
			s.data.Diff = (s.value[0].Val - s.value[1].Val) / s.Divider
		}

		s.data.Percents = uint((s.data.Value - s.Min) / s.maxMinDiff)
	}

	// start sensor polling
	go func() {
		ctx, cancel := context.WithCancel(context.Background())
		s.cancelFunc = cancel
		ticker := time.NewTicker(time.Duration(s.PollInterval) * time.Millisecond)

		defer func() {
			log.Info("Stopped sensor '%s'", s.Uid)
			ticker.Stop()
			s.input.Close()
			s.doneCh <- true
		}()

		log.Info("Started sensor '%s'", s.Uid)

		loop := true
		for loop {
			getReadings()
			select {
			case <-ctx.Done():
				loop = false
				break
			case <-ticker.C:
			}
		}

	}()

	return nil
}

func (s *Sensor) stop() {
	s.Lock()
	defer s.Unlock()

	if s.cancelFunc != nil {
		// signal sensor to stop
		s.cancelFunc()
		// wait for it to finish
		<-s.doneCh
		s.cancelFunc = nil
	}
}

func Run() error {

	if err := config.Read(); err != nil {
		return err
	}

}
