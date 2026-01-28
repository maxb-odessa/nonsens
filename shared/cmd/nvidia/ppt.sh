#! /bin/bash
/usr/bin/nvidia-smi --query-gpu=power.draw.instant --format=noheader,nounits
