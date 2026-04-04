package def

import "time"

// may be overwritten by cmdline
var (
	DataDir      string = "$HOME/.local/nonsens"
	ServerListen string = "localhost:22222"
)

// paths relative to DataDir, should not be changed
const (
	SensorsFile = "sensors.json"
	LayoutFile  = "layout.html"
	ServerDir   = "server"
	CmdDir      = "cmd"
)

// defaults and limits
const (
	SensorMinPollInterval = 100 * time.Millisecond
	ServerReadTimeout     = 10 * time.Second
	ServerWriteTimeout    = 10 * time.Second
	InputLineMax          = 100
	InputPosMax           = 100
)
