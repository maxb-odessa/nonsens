// Package router provides data exchange capabilities
package router

import (
	"errors"
)

type Message struct {
	Cmd  int
	Data string
}

type Router struct {
	id      int
	readCh  chan *Message
	writeCh chan *Message
}

const (
	SENSORS int = iota
	WEBSERVER
)

var routers map[int]*Router

func init() {
	routers = make(map[int]*Router, 0)
}

// Register creates and registeres new router
func Register(id int) (*Router, error) {
	if Find(id) != nil {
		return nil, errors.New("already registered")
	}

	routers[id] = &Router{
		id:      id,
		readCh:  make(chan *Message, 16), // TBD: is 16 ok?
		writeCh: make(chan *Message, 16),
	}

	return routers[id], nil
}

// Find already created router
func Find(id int) *Router {
	if r, ok := routers[id]; ok {
		return r
	}
	return nil
}

// Read a message from router, possibly in NonBlockiong mode
func (r *Router) Read(nb bool) (*Message, error) {

	if nb {
		select {
		case msg, ok := <-r.readCh:
			if ok {
				return msg, nil
			}
			return nil, errors.New("channel read failed")
		default:
			return nil, nil
		}
	} else {
		msg := <-r.readCh
		return msg, nil
	}

}

// Write message to router, possibly in NonBlocking mode
func (r *Router) Write(msg *Message, nb bool) error {

	if nb {
		select {
		case r.writeCh <- msg:
			return nil
		default:
			return errors.New("channel write failed")
		}
	} else {
		r.writeCh <- msg
		return nil
	}

}
