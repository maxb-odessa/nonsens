package sensors

func Init(dataDir string) error {
	return restore(dataDir + "/sensors.json")
}

func Run() error {
	return nil
}
