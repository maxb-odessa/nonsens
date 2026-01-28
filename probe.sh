#! /bin/bash

DIRLIST=`find /sys/devices/ -type f -name "name" | egrep -v '(wakeup|cpuidle)'`

for i in $DIRLIST; do
	d=`readlink -f $i`
	dir=`dirname $d`
	name=`cat $d`
	echo -e "$name\n$dir"
	find ${dir} -maxdepth 1 -type f
	echo
done
