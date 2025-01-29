# Simple Realtime Server Digital Video Recorder

Upload [SRS](https://ossrs.io/lts/en-us/) FLV to the DVR

## Installation

## Contributing

### Tools

- [Node.js](https://nodejs.org/en)
- [Yarn (v4+)](https://yarnpkg.com/)
- [Docker](https://docs.docker.com/)
- [FFmpeg](https://www.ffmpeg.org/)

### Environment

Run the following commands to bootstrap the local environment:

```sh
cp .env.example .env
sed -i "s/^CANDIDATE=.*/CANDIDATE=$(ifconfig eth0 | grep 'inet ' | awk '{print $2}')/" .env
docker compose -f compose.srs.yml up -d

# If you want metrics (available at http://localhost:3000/)
docker compose -f compose.grafana.yml up -d
```

You can then run the DVR with `yarn dev` and test the webhook with `yarn stream` which will run an ffmpeg command to the SRS.
