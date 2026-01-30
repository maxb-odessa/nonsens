package server

import (
	"nonsens/internal/config"
	"nonsens/internal/def"
	log "nonsens/internal/logger"
	"nonsens/internal/sensors"

	"net/http"
	"os"
	"path/filepath"

	"github.com/gorilla/mux"
	ws "github.com/gorilla/websocket"
)

const (
	// remote message target: sensor data or layout
	// no 'iota' here - use same value in web page JS files
	MSG_TARGET_LAYOUT = 0
	MSG_TARGET_SENSOR = 1

	MSG_ACTION_ADD    = 10
	MSG_ACTION_DELETE = 11
	MSG_ACTION_UPDATE = 12
)

// message to send to remote via websocket
// client<->server comm protcol
type remoteMsg struct {
	Target  int    `json:"target"`  // message taget: sensor or layout
	Id      string `json:"id"`      // sensor id
	Action  int    `json:"action"`  // what to do
	Payload any    `json:"payload"` // data to send/read
}

var (
	webPageLayout     string
	webPageLayoutFile string
	toRemoteCh        chan *remoteMsg
	fromSensorsCh     chan *sensors.Sensor
)

func Run() error {

	// load saved web page layout (if exists)
	webPageLayoutFile, _ = filepath.Abs(os.ExpandEnv(def.DataDir + "/" + def.LayoutFile))
	if layout, err := config.Load(webPageLayoutFile); err != nil {
		log.Err("Failed to load saved layout file: %s", err)
	} else {
		webPageLayout = string(layout)
	}

	// run websocket sender channel dispatcher
	// (to send the same sensor data to all connected clients)
	toRemoteCh = make(chan *remoteMsg, 256)
	go chanDispatcher(toRemoteCh)

	// run sensors data reader
	fromSensorsCh = make(chan *sensors.Sensor, 256)
	go receiveSensorsData(fromSensorsCh)

	// run sensors poller
	if err := sensors.Start(fromSensorsCh); err != nil {
		return err
	}

	// run web server
	return startServer()
}

// the data read from sensors chan is always of "full" type, thus me should extract its "value"
func receiveSensorsData(ch chan *sensors.Sensor) {
	for sens := range ch {
		sendToRemote(&remoteMsg{
			Target:  MSG_TARGET_SENSOR,
			Id:      sens.Uid,
			Action:  MSG_ACTION_UPDATE,
			Payload: sens.Value, // TODO make a COPY of values! TODO use s.Lock() ?
		})
	}
}

// send message to all remote clients
func sendToRemote(msg *remoteMsg) {
	select {
	case toRemoteCh <- msg:
	default:
	}
}

// send stored web page layout to remote client
func sendWebPageLayout() {
	sendToRemote(&remoteMsg{
		Target:  MSG_TARGET_LAYOUT,
		Action:  MSG_ACTION_UPDATE,
		Id:      "",
		Payload: webPageLayout,
	})
}

// process remote message
func gotFromRemote(msg *remoteMsg) {

	if msg.Target == MSG_TARGET_LAYOUT {

		// the only supported action for now
		if msg.Action == MSG_ACTION_UPDATE {
			// update and store new layout
			// we expect plain html string as a payload
			webPageLayout = msg.Payload.(string)
			if err := config.Save(webPageLayoutFile, []byte(webPageLayout)); err != nil {
				log.Err("Failed to save web page layout: %s", err)
			}
			// send new layout to every connected client
			sendWebPageLayout()
		}

	} else if msg.Target == MSG_TARGET_SENSOR {

		// see action: add, del, upd, etc...
		switch msg.Action {
		case MSG_ACTION_ADD:
			sensors.Add(msg.Id, msg.Payload.(string))
		case MSG_ACTION_DELETE:
			sensors.Delete(msg.Id)
		case MSG_ACTION_UPDATE:
			sensors.Update(msg.Id, msg.Payload.(string))
		default:
			log.Warn("Undefined 'action' from remote: %d", msg.Action)
		}
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

		wsChan := make(chan *remoteMsg, 256)
		wsChanId := wsChanSerial
		registerChan(wsChan, wsChanId)
		wsChanSerial++

		defer func() {
			log.Info("Websocket connection closed: %s", conn.RemoteAddr())
			conn.Close()
			unregisterChan(wsChanId)
			close(wsChan)
		}()

		// setup websocket reader
		reader := func() {
			msg := new(remoteMsg)
			for {
				if err := conn.ReadJSON(msg); err != nil {
					log.Err("Websocket error: %s", err)
					return
				} else {
					log.Debug(9, "Got from remote: %+v", msg)
					gotFromRemote(msg)

				}
			}
		}

		// run websocket reader
		go reader()

		// send saved webpage layout upon browser connection
		sendWebPageLayout()

		// also force all running sensors to update their values
		// this is useful for sebsors with long delays to send at least something
		// to remote upon a connection
		sensors.ForceReadAll()

		// run websocket writer
		for {
			select {
			case msg, ok := <-wsChan:

				if !ok {
					return
				}

				log.Debug(9, "will send to ws: %+v", msg)

				if err = conn.WriteJSON(msg); err != nil {
					log.Err("Websocket send() failed: %s", err)
					return
				}

			} // select
		} // for
	} // wshandler

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
