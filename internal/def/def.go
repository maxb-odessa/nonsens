package def

// may be changed by cmdline
var DataDir string = "$HOME/.local/nonsens"
var ServerListen string = "localhost:12346"

// relative paths and dirs
const (
	SensorsConfigFile = "/sensors.json"
	TemplatesDir      = "/templates/"
	ServerDir         = "/server/"
	CmdDir            = "/cmd"
)

// sensors defaults and limits
const (
	SensorMinPollInterval = 100 // in ms
)
