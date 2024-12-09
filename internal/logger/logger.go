package logger

import (
	"log"
	"os"
)

var (
	info       *log.Logger
	warn       *log.Logger
	err        *log.Logger
	fatal      *log.Logger
	debug      *log.Logger
	debugLevel int
)

func init() {
	info = log.New(os.Stdout, "INFO: ", log.Lmsgprefix|log.Ldate|log.Ltime)
	warn = log.New(os.Stdout, "WARNING: ", log.Lmsgprefix|log.Ldate|log.Ltime)
	err = log.New(os.Stderr, "ERROR: ", log.Lmsgprefix|log.Ldate|log.Ltime)
	fatal = log.New(os.Stderr, "FATAL: ", log.Lmsgprefix|log.Ldate|log.Ltime)
	debug = log.New(os.Stdout, "DEBUG: ", log.Lmsgprefix|log.Ldate|log.Ltime|log.Lshortfile)
}

func SetDebugLevel(level int) {
	if level < 0 {
		debugLevel = 0
	} else if level > 9 {
		debugLevel = 9
	} else {
		debugLevel = level
	}
}

func Info(args ...any) {
	info.Printf(args[0].(string), args[1:]...)
}

func Warn(args ...any) {
	warn.Printf(args[0].(string), args[1:]...)
}

func Err(args ...any) {
	err.Printf(args[0].(string), args[1:]...)
}

func Fatal(args ...any) {
	fatal.Printf(args[0].(string), args[1:]...)
}

func Debug(level int, args ...any) {
	if level >= debugLevel {
		debug.Printf(args[0].(string), args[1:]...)
	}
}
