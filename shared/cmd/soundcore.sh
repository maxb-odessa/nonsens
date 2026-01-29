#! /bin/bash
exec 2>/dev/null
export PATH=$HOME/.local/bin:$PATH:
dbus-send --print-reply=literal \
	--system --dest=org.bluez \
		/org/bluez/hci0/dev_E8_EE_CC_29_12_06 \
		org.freedesktop.DBus.Properties.Get string:"org.bluez.Battery1" string:"Percentage" \
| awk '{print $3}'
