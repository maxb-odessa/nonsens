#! /bin/bash
export PATH=$HOME/.local/bin:$PATH:
razer-cli -l | grep charge | awk '{print $2}'
