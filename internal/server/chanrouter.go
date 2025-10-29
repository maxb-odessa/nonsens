package server

import (
	log "nonsens/internal/logger"
	"sync"
)

var (
	wsChans map[uint64]chan []byte
	mutex   sync.Mutex
)

func registerChan(ch chan []byte, id uint64) {
	mutex.Lock()
	defer mutex.Unlock()

	wsChans[id] = ch

	log.Debug(9, "REG chan id %d", id)
}

func unregisterChan(id uint64) {
	mutex.Lock()
	defer mutex.Unlock()

	if _, ok := wsChans[id]; ok {
		delete(wsChans, id)
		log.Debug(9, "UNREG chan id %d", id)
	}
}

func chanDispatcher(ch chan []byte) {

	wsChans = make(map[uint64]chan []byte)

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				continue
			}
			mutex.Lock()
			for id, wsCh := range wsChans {
				select {
				case wsCh <- msg:
					log.Debug(9, "SEND chan id %d", id)
				default:
					log.Debug(9, "chan send to %d failed", id)
				}
			}
			mutex.Unlock()
		}
	}
}
