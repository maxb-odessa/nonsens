package logger

import (
	"fmt"
	"log"
	"os"
	"runtime"
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
	os.Exit(1)
}

func Debug(level int, args ...any) {
	if level < debugLevel {
		return
	}

	var prefix string
	if pc, file, no, ok := runtime.Caller(1); ok {
		details := runtime.FuncForPC(pc)
		if details != nil {
			prefix += fmt.Sprintf("%s():%d", details.Name(), no)
		} else {
			prefix = fmt.Sprintf("%s:%d", file, no)
		}
		prefix += " "
	}

	debug.Printf(prefix+args[0].(string), args[1:]...)
}
