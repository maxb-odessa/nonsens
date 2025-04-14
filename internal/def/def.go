package def

// relative paths and dirs
const (
	DataDir           = "$HOME/.local/nonsens"
	SensorsConfigFile = "/sensors.json"
	TemplatesDir      = "/templates/"
	ServerDir         = "/server/"
)

// sensors defaults and limits
const (
	SensorMinPollInterval = 100 // in ms
)

// ws server defaults
const (
	ServerListen = "localhost:12346"
)
