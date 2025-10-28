package def

import "time"

// may be overwritten by cmdline
var (
	DataDir      string = "$HOME/.local/nonsens"
	ServerListen string = "localhost:12346"
)

// should not be changed
const (
	ConfigFile = "/config.json"
	ServerDir  = "/server/"
	ExecDir    = "/exec"
)

// sensors defaults and limits
const (
	SensorMinPollInterval = 100 * time.Millisecond
)
