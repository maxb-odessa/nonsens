#! /bin/bash
export PATH=$HOME/.local/bin:$PATH:
dbus-send --print-reply=literal \
	--system --dest=org.bluez \
		/org/bluez/hci0/dev_A5_EA_D8_8A_02_5B \
		org.freedesktop.DBus.Properties.Get string:"org.bluez.Battery1" string:"Percentage" \
| awk '{print $3}'
