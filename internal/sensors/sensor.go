package sensors

import (
	"context"
	"fmt"
	log "nonsens/internal/logger"
	"nonsens/internal/sensors/input"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Sensor struct {
	Uid string `json:"uid"` // uniq sensor id, will be generated if new

	// private data
	pvt struct {
		sync.Mutex
		cancelFunc func()
	}

	// runtimes
	runtime struct {
		input      input.Input          // sensor input interface
		values     [2]*input.InputValue // store prev and curr value
		maxMinDiff float64              // Max - Min, for faster percents calculations
	}

	// calculated, will be sent to remote client in 'V' type messages
	Value struct {
		Val, Diff float64
		Percents  int
		Online    bool
		Hint      string
	} `json:"-"`

	// configured params
	Config struct {
		InType       string  `json:"type"`      // input type: "file" or "cmd"
		Path         string  `json:"path"`      // full path to file or command
		KeepOpen     bool    `json:"keep_open"` // for files: keep it open for readings
		Min          float64 `json:"min"`       // min input value, divider applied
		Max          float64 `json:"max"`       // max input value, divider applied
		Divider      float64 `json:"divider"`   // input value divider (can be negaive)
		PollInterval int     `json:"poll_ms"`   // milliseconds
	} `json:"config"`

	// widget params
	Widget struct {
		Title        string  `json:"title"`      // visible sensor name
		Units        string  `json:"units"`      // suffix shown value with units string
		Fractions    int     `json:"fractions"`  // show only this number of value fractions, i.e. 2 = 1.23 for 1.23456 valuea
		TextColor    string  `json:"text_color"` // text color
		Color0       string  `json:"color0"`     // min value color (at 0%)
		ColorN       string  `json:"colorn"`     // curr value color (at N%)
		Color100     string  `json:"color100"`   // max value color (at 100%)
		ColorNP      float64 `json:"colornp"`    // colorN percents position
		ShowGradient bool    `json:"gradient"`   // use gradient or plain color?

		GroupId   string `json:"group_id"` // the widget belongs to this group
		GroupCol  int    `json:"col"`      // put the widget at this col in group
		GroupRow  int    `json:"row"`      // put the widget at this row in group
		GroupColN int    `json:"col_n"`    // the widget occupies N columns inside a group
		GroupRowN int    `json:"row_n"`    // the widget occupies N rows inside a group

		Style string `json:"style"` // css style name for this widget
	} `json:"widget"`
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

	// generate new uid if not set
	if s.Uid == "" {
		s.Uid = uuid.New().String()
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
			case sensorsChan <- s: // yes, send out a pointer at ourselves
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

func (s *Sensor) update() {
	// stop
	// update
	// start
}
