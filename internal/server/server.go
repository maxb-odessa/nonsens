package server

import (
	"encoding/json"
	"net/http"
	"nonsens/internal/def"
	log "nonsens/internal/logger"
	"nonsens/internal/sensors"
	"os"
	"path/filepath"

	"github.com/gorilla/mux"
	ws "github.com/gorilla/websocket"
)

var (
	toRemoteCh    chan []byte
	sensorsDataCh chan *sensors.Sensor
)

func Run() error {

	// prepare websocket sender channel
	toRemoteCh = make(chan []byte, 64)

	// run websocket sender channel dispatcher
	// (to send the same sensor data to all connected clients)
	go chanDispatcher(toRemoteCh)

	// prepare sensors communication channel
	// (read sensors values from this channel)
	sensorsDataCh := make(chan *sensors.Sensor, 64)

	// start reading sensors data
	go readSensors(sensorsDataCh)

	// run sensors poller
	if err := sensors.Start(sensorsDataCh); err != nil {
		return err
	}

	// run web server
	return startServer()
}

const (
	// remote message types: sensor value only or full data
	REMOTE_MSG_TYPE_VAL  = 'V'
	REMOTE_MSG_TYPE_FULL = 'F'

	// remote message sensor action: add, del, update
	REMOTE_MSG_ACTION_ADD = 'A'
	REMOTE_MSG_ACTION_DEL = 'D'
	REMOTE_MSG_ACTION_UPD = 'U'
)

// message to send to remote via websocket
type RemoteMsg struct {
	Type byte // message type (sse above)
	Data any  // data to send/read
}

// the data read is always of "full" type, thus me should extract its "value"
func readSensors(ch chan *sensors.Sensor) {
	for full := range ch {
		msg := &RemoteMsg{
			Type: REMOTE_MSG_TYPE_VAL,
			Data: full.Value,
		}
		if jmsg, err := json.Marshal(msg); err == nil {
			sendToRemote([]byte(jmsg))
		}
	}
}

func sendToRemote(data []byte) {
	select {
	case toRemoteCh <- data:
	default:
		log.Warn("toRemoteCh is full, dropping data")
	}
}

// serve web requests
func startServer() error {

	var wsChanSerial uint64

	router := mux.NewRouter()

	wsHandler := func(w http.ResponseWriter, r *http.Request) {
		var upgrader = ws.Upgrader{
			ReadBufferSize:  8192,
			WriteBufferSize: 8192,
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Err("Websocket upgrade failed: %s", err)
			return
		}

		log.Info("Websocket connected: %s", conn.RemoteAddr())

		wsChan := make(chan []byte, 64)
		wsChanId := wsChanSerial
		wsChanSerial++
		registerChan(wsChan, wsChanId)

		defer func() {
			log.Info("Websocket connection closed: %s", conn.RemoteAddr())
			conn.Close()
			unregisterChan(wsChanId)
			close(wsChan)
		}()

		// setup websocket reader
		reader := func() {
			for {
				msgType, msgData, err := conn.ReadMessage()

				if err != nil {
					log.Err("Websocket error: %s", err)
					return
				}

				switch msgType {
				case ws.CloseMessage:
					return
				case ws.TextMessage:
					log.Debug(5, "Got from remote: %+v", string(msgData))
					processFeedback(msgData)
				}
			}
		}

		// run websocket reader
		go reader()

		// run websocket writer
		for {
			select {
			case msg, ok := <-wsChan:
				if !ok {
					return
				}
				log.Debug(9, "will send to ws: %q", string(msg))
				if err = conn.WriteMessage(ws.TextMessage, msg); err != nil {
					log.Err("Websocket send() failed: %s", err)
					return
				} else {
					log.Debug(9, "ws sent: %q", string(msg))
				}
			}
		}
	}

	// websocket request handler
	router.HandleFunc("/ws", wsHandler)

	// static files handler
	pageDir, err := filepath.Abs(os.ExpandEnv(def.DataDir + "/" + def.ServerDir))
	if err != nil {
		return err
	}
	log.Info("Serving index dir: %s", pageDir)

	// NB: that odd "nosniff" thingie
	router.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir(pageDir))))

	log.Info("Listening at %s", def.ServerListen)

	sr := &http.Server{
		Handler:      router,
		Addr:         def.ServerListen,
		ReadTimeout:  def.ServerReadTimeout,
		WriteTimeout: def.ServerWriteTimeout,
	}

	return sr.ListenAndServe()
}
