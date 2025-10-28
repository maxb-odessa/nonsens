package main

import (
	"os"
	"os/signal"
	"path/filepath"
	"runtime/pprof"
	"syscall"

	"github.com/pborman/getopt/v2"

	"nonsens/internal/def"
	log "nonsens/internal/logger"
	"nonsens/internal/server"
)

func main() {

	// config defaults
	help := false
	profileTo := ""
	debugLevel := 0
	getopt.HelpColumn = 0

	// get cmdline args and parse them
	getopt.FlagLong(&help, "help", 'h', "Show this help")
	getopt.FlagLong(&debugLevel, "debug", 'D', "Set debug log level [0]")
	getopt.FlagLong(&profileTo, "profile", 'p', "Enable runtime profiler and write output to this file")
	getopt.FlagLong(&def.DataDir, "datadir", 'd', "Path to application data directory")
	getopt.FlagLong(&def.ServerListen, "listen", 'l', "Serve requests at this interface[:port]")
	getopt.Parse()

	// help-only requested
	if help {
		getopt.Usage()
		return
	}

	log.SetDebugLevel(debugLevel)

	def.DataDir, _ = filepath.Abs(os.ExpandEnv(def.DataDir))

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
	doneCh := make(chan bool)
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
		for sig := range sigCh {
			log.Info("Got signal '%s'", sig)
			doneCh <- true
		}
	}()

	log.Info("Started")
	defer log.Info("Stopped")

	// run!
	go func() {
		if err := server.Run(); err != nil {
			log.Fatal("Failed to run server: %s", err)
		} else {
			log.Info("Started")
		}
	}()

	// now wait
	<-doneCh
}
