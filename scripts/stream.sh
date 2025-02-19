#!/bin/bash

# Usage: ./stream.sh <quality> [duration]
#
# quality: Quality of the stream. One of `sd` or `hd`.
# duration: Duration of the stream in seconds. Default is 3 seconds.
#
# examples:
#	./stream.sh sd			Stream for 5 seconds in 480p
#	./stream.sh sd 10		Stream for 10 seconds in 480p
#	./stream.sh sd inf		Stream indefinitely in 480p
#	./stream.sh hd			Stream for 5 seconds in 1080p
#	./stream.sh hd 10		Stream for 10 seconds in 1080p

quality="size=720x480:rate=30"
duration=":duration=5"

if [ "$1" = "hd" ]; then
	quality="size=1920x1080:rate=60"
elif [ "$1" != "sd" ]; then
	echo "Usage: ./stream.sh <quality> [duration]"
	exit 1
fi

if [ "$2" = "inf" ]; then
	duration=""
elif [[ -n "$2" ]]; then
	duration=":duration=$2"
fi

cd "$(dirname "$0")"

sudo chown -R $USER ../data/live/livestream # SRS runs as root
rm -r ../data/live/livestream # Remove old files

ffmpeg \
	-f lavfi \
	-i testsrc=$quality$duration \
	-c:v libx264 \
	-flvflags no_duration_filesize \
	-f flv rtmp://localhost:1935/app_id/stream_id
