package sensors

type inCmd struct {
	path      string
	keepAlive bool
}

func (in *inCmd) SetPath(path string) error {
	in.path = path
	return nil
}

func (in *inCmd) SetKeepAlive(on bool) {
	in.keepAlive = on
}

func (in *inCmd) Get() (float64, error) {
	return 0, nil
}

func (in *inCmd) Close() {
	// close?
}
