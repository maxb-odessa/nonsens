package sensors

import (
	"context"
	"fmt"
	log "nonsens/internal/logger"
	"nonsens/internal/sensors/input"
	"sync"
	"time"
)

type Value struct {
	Val      float64 `json:"value"`    // current sensor value
	Diff     float64 `json:"diff"`     // difference between current and previous values
	Percents int     `json:"percents"` // current value in percents of min-max
	Online   bool    `json:"online"`   // is sensor online?
	Hint     string  `json:"hint"`     // hint string if sensor is offline
}

type Config struct {
	InType       string  `json:"type"`      // input type: "file" or "cmd"
	Path         string  `json:"path"`      // full path to file or command
	KeepOpen     bool    `json:"keep_open"` // for files: keep it open for readings
	PollInterval int     `json:"poll_ms"`   // milliseconds
	Min          float64 `json:"min"`       // min input value, divider applied
	Max          float64 `json:"max"`       // max input value, divider applied
	Divider      float64 `json:"divider"`   // input value divider (can be negaive)
}

type Sensor struct {

	// private data
	pvt struct {
		sync.Mutex
		cancelFunc func()
	} `json:"-"`

	// runtimes
	runtime struct {
		input      input.Input          // sensor input interface
		values     [2]*input.InputValue // store prev and curr value
		maxMinDiff float64              // Max - Min, for faster percents calculations
	} `json:"-"`

	// uniq sensor id, will be generated if new
	Uid string

	// configured params, set by remote client
	Config Config

	// calculated sensor value, will be sent to remote client
	Value Value `json:"-"`
}

func (s *Sensor) setup() error {

	// invalid min/max range
	if s.Config.Min >= s.Config.Max {
		return fmt.Errorf("Min value >= Max value")
	}

	// invalid divider
	if s.Config.Divider == 0.0 {
		return fmt.Errorf("Divider can not be zero")
	}

	// invalid poll interval
	if s.Config.PollInterval <= 0 {
		return fmt.Errorf("Poll interval must be > 0")
	}

	s.runtime.values = [2]*input.InputValue{{}, {}}

	s.runtime.maxMinDiff = (s.Config.Max - s.Config.Min) / 100.0

	// create sensor input
	return s.runtime.input.Setup(
		s.Config.Path,
		s.Config.InType,
		s.Config.KeepOpen,
		time.Duration(s.Config.PollInterval)*time.Millisecond)
}

func (s *Sensor) start() error {

	// lock the sensor for entire polling lifetime
	// prevents sensor subsequents starts and in-run reconfigurations
	s.pvt.Lock()

	if err := s.setup(); err != nil {
		s.pvt.Unlock()
		return err
	}

	getReadings := func() {
		defer func() {
			log.Debug(9, "sensor %s collected: %+v", s.Uid, s.Value)
			select {
			case toServerCh <- s: // send whole sensor to server, it will be parsed there
			default:
				log.Warn("Sensors data queue is full, discarding")
			}
		}()

		// save prev value
		s.runtime.values[1] = s.runtime.values[0]

		// get new value
		s.runtime.values[0] = s.runtime.input.Get()
		log.Debug(9, "sensor(%s).get() => %f, %v", s.Config.Path, s.runtime.values[0].Val, s.runtime.values[0].Err)

		s.Value.Online = (s.runtime.values[0].Err == nil)

		// sensor if offline - we're done here
		if !s.Value.Online {
			s.Value.Hint = s.runtime.values[0].Err.Error()
			return
		} else {
			s.Value.Hint = ""
		}

		// if no errors: store new value and calc diff
		s.Value.Val = s.runtime.values[0].Val / s.Config.Divider
		if s.runtime.values[1].Err == nil {
			s.Value.Diff = (s.runtime.values[0].Val - s.runtime.values[1].Val) / s.Config.Divider
		}

		s.Value.Percents = int((s.Value.Val - s.Config.Min) / s.runtime.maxMinDiff)
	}

	// start sensor polling
	go func() {

		ctx, cancel := context.WithCancel(context.Background())
		s.pvt.cancelFunc = cancel
		ticker := time.NewTicker(time.Duration(s.Config.PollInterval) * time.Millisecond)

		defer func() {
			ticker.Stop()
			s.runtime.input.Close()
			log.Info("Stopped sensor '%s'", s.Uid)
			s.pvt.Unlock() // release the sensor at stop
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

	// not running? do nothing
	if s.pvt.cancelFunc == nil {
		return
	}

	// signal sensor to stop
	s.pvt.cancelFunc()

	// wait for it to finish (it will unlock itself upon finish)
	s.pvt.Lock()

	// cleanups
	s.pvt.cancelFunc = nil

	// release it for other operations
	s.pvt.Unlock()
}
