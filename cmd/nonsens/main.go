package main

import (
	"os"
	"os/signal"
	"runtime/pprof"
	"syscall"

	"github.com/pborman/getopt/v2"

	log "nonsens/internal/logger"
	"nonsens/internal/templates"
	"nonsens/internal/webserver"
	"nonsens/internal/sensors"
	
)

func main() {

	// config defaults
	help := false
	profileTo := ""
	debugLevel := 0
	dataDir := os.ExpandEnv("$HOME/.local/share/nonsens")
	listenAt := "localhost:12346"
	getopt.HelpColumn = 0

	// get cmdline args and parse them
	getopt.FlagLong(&help, "help", 'h', "Show this help")
	getopt.FlagLong(&debugLevel, "debug", 'd', "Set debug log level [0]")
	getopt.FlagLong(&profileTo, "profile", 'p', "Enable runtime profiler and write output to this file")
	getopt.FlagLong(&dataDir, "datadir", 'D', "Path to data directory")
	getopt.FlagLong(&listenAt, "listen", 'l', "Serve requests at this interface[:port]")
	getopt.Parse()

	// help-only requested
	if help {
		getopt.Usage()
		return
	}

	log.SetDebugLevel(debugLevel)

	// don't run us as root
	if os.Getuid() == 0 || os.Geteuid() == 0 {
		log.Err("Please don't run me as root")
		return
	}

	if len(profileTo) > 0 {
		if fd, err := os.Create(profileTo); err != nil {
			log.Warn("Failed to enable profiler: %s", err)
		} else {
			log.Info("Saving profiling output to '" + profileTo + "'")
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
	defer log.Info("Stopped")

	// load templates
	if err := templates.Init(dataDir); err != nil {
		log.Fatal("Failed to load templates: %s", err)
	}

	// init web server
	if err := webserver.Init(listenAt, dataDir); err != nil {
		log.Fatal("Failed to init web server: %s", err)
	}

	// load and init saved sensors
	if err := sensors.Init(dataDir); err != nil {
		log.Fatal("Failed to init sensors: %s", err)
	}

	// run webserver
	webserver.Run()

	// run sensors
	sensors.Run()

	// now wait
	<-done
}
