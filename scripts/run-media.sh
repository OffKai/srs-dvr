#!/bin/sh

cd "$(dirname "$0")"

sudo chown -R $USER ../data/live/livestream # SRS runs as root
rm -r ../data/live/livestream # Remove old files

ffmpeg -re -i ./source.flv -c copy -f flv rtmp://localhost:1935/live/livestream
