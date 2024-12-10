// Package router provides data exchange capabilities
package router

import "errors"

type Message struct {
	Cmd  int
	Data string `json`
}

type Router struct {
	id      int
	readCh  chan *Message
	writeCh chan *Message
}

var routers map[string]*Router

func init() {
	routers = make(map[string]*Router, 0)
}

// Register creates and registeres new router
func Register(id string) (*Router, error) {
	if Find(id) != nil {
		return nil, errors.New("already registered")
	}

	routers[id] = &Router{
		id:      id,
		readCh:  make(chan *message, 16),
		writeCh: make(chan *message, 16),
	}

	return routers[id]
}

// Find already created router
func Find(id string) *Router {
	if r, ok := routers[id]; ok {
		return r
	}
	return nil
}

func (r *Router) String() string {
	return r.id
}

// Read message from router, possibly in NonBlocking mode
func (r *Router) Read(nb bool) (*Message, error) {
	return nil, nil
}

// Write message to router, possibly in NonBlocking mode
func (r *Router) Write(msg *Message, nb bool) error {
	return nil
}
