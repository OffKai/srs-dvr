#!/bin/bash

# player: http://localhost:8080/players/srs_player.html?autostart=true&app=dvr&stream=stream_1.flv&port=8080&schema=http

# Usage: ./stream.sh <quality> [options]
#
# args:
#	quality: Quality of the stream. One of `sd`, `hd`, or `4k`.
#
# options:
#	-d, --duration: Duration of the stream in seconds. Default is 5 seconds.
#	-m, --multi: Number of streams to start concurrently. Default is 1.
#	--silent: Suppress ffmpeg output.
#
# examples:
#	./stream.sh sd					Stream for 5 seconds in 480p
#	./stream.sh sd --duration=10	Stream for 10 seconds in 480p
#	./stream.sh sd --duration=inf	Stream indefinitely in 480p
#	./stream.sh hd					Stream for 5 seconds in 1080p
#	./stream.sh 4k					Stream for 5 seconds in 2160p

## Variables ##
QUALITY="size=720x480:rate=30"
DURATION=":duration=5"
COUNT="1"
LOGLEVEL="info"

## Args ##
if [ "$1" = "hd" ]; then
	QUALITY="size=1920x1080:rate=60"
elif [ "$1" = "4k" ]; then
	QUALITY="size=3840x2160:rate=60"
elif [ "$1" != "sd" ]; then
	echo "Usage: ./stream.sh <quality> [options]"
	exit 1
fi

## Opts ##
for i in "$@"; do
	case $i in
		-d=*|--duration=*)
			DURATION_VAL=${i#*=}

			if [ "$DURATION_VAL" = "inf" ]; then
				DURATION=""
			elif [[ -n "$DURATION_VAL" ]]; then
				DURATION=":duration=$DURATION_VAL"
			fi

			shift
			;;
		-m=*|--multi=*)
			COUNT="${i#*=}"
			shift
			;;
		--silent)
			LOGLEVEL="error"
			shift
			;;
		-*|--*)
			echo "Unknown option $i"
			exit 1
			;;
		*)
			;;
	esac
done

function cmd {
	ffmpeg \
		-loglevel $LOGLEVEL \
		-f lavfi \
		-i testsrc=$QUALITY$DURATION \
		-c:v libx264 \
		-profile:v baseline \
		-vf format=yuv420p \
		-flvflags no_duration_filesize \
		-f flv "rtmp://localhost:1935/$1/$2"
}

cd "$(dirname "$0")"

sudo chown -R $USER "../data" # SRS runs as root
rm -r "../data/dvr/" # Remove old files

trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

for i in $(seq 1 $COUNT); do
	echo "Starting stream $i"

	# Run the last command in the foreground
	if [ $i = $COUNT ]; then
		cmd dvr stream_$i
	else
		cmd dvr stream_$i &
	fi
done
