// Package webserver serves http/ws requests
package webserver

import "nonsens/internal/router"

var (
	webServerRouter *router.Router
	sensorsRouter   *router.Router
)

func Init(dir string) error {
	webServerRouter, _ = router.Register(router.WEBSERVER)

	// load index, js and css files

	return nil
}

func Run() error {
	sensorsRouter = router.Find(router.SENSORS)
	return nil
}
