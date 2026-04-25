
PREFIX		=	${HOME}/.local
SHAREDIR	=	${PREFIX}/share/nonsens
GOBIN		=	${PREFIX}/bin

GO111MODULE	=	auto

all: build

build:
	go build ./cmd/nonsens

install: install-bin install-data

install-bin:
	go env -w GOBIN=${GOBIN}
	go install ./cmd/nonsens

install-data:
	mkdir -p ${SHAREDIR}
	cp -a shared/cmd ${SHAREDIR}
	cp -a shared/server ${SHAREDIR}
	cp -a nonsens.service ${HOME}/.config/systemd/user/
	systemctl --user daemon-reload
	systemctl --user enable nonsens
	systemctl --user restart nonsens

