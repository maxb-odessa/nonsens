package main

import (
	"os"
	"os/signal"
	"runtime/pprof"
	"syscall"

	"github.com/pborman/getopt/v2"

	log "nonsens/internal/logger"
	"nonsens/internal/sensors"
	"nonsens/internal/templates"
	"nonsens/internal/webserver"
)

func main() {

	// config defaults
	help := false
	profile := false
	debug := 0
	dataDir := os.ExpandEnv("$HOME/.local/share/nonsens")
	getopt.HelpColumn = 0

	// get cmdline args and parse them
	getopt.FlagLong(&help, "help", 'h', "Show this help")
	getopt.FlagLong(&debug, "debug", 'd', "Set debug log level")
	getopt.FlagLong(&profile, "profile", 'p', "Enable CPU profiler (/tmp/nonsens.prof)")
	getopt.FlagLong(&dataDir, "dataDir", 'D', "Path to data directory")
	getopt.Parse()
	log.SetDebugLevel(debug)

	// help-only requested
	if help {
		getopt.Usage()
		return
	}

	// don't run us as root
	if os.Getuid() == 0 || os.Geteuid() == 0 {
		log.Err("Please don't run me as root")
		return
	}

	if profile {
		if fd, err := os.Create("/tmp/nonsens.prof"); err != nil {
			log.Warn("Failed to enable profiler: %s", err)
		} else {
			log.Info("Saving profiling output to '/tmp/nonsens.prof'")
			pprof.StartCPUProfile(fd)
			defer pprof.StopCPUProfile()
		}
	}

	// set proggie termination signal handler(s)
	done := make(chan bool)
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
		for sig := range sigCh {
			log.Info("Got signal '%s'", sig)
			done <- true
		}
	}()

	log.Info("Started")
	defer log.Info("Exited")

	// load and init templates
	if err := templates.Init(dataDir); err != nil {
		log.Fatal("Failed to init templates: %s", err)
		return
	}

	// load and init webpage
	if err := webserver.Init(dataDir); err != nil {
		log.Fatal("Failed to init webpage: %s", err)
		return
	}

	// load and init saved sensors
	if err := sensors.Init(dataDir); err != nil {
		log.Fatal("Failed to init sensors: %s", err)
		return
	}

	// start http server
	if err := webserver.Run(); err != nil {
		log.Fatal("Failed to run HTTP server: %s", err)
		return
	}

	// start sensors poller
	if err := sensors.Run(); err != nil {
		log.Fatal("Failed to run sensors poller: %s", err)
	}

	// now wait
	<-done
}
