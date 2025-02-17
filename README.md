# Simple Realtime Server Digital Video Recorder

Upload [SRS](https://ossrs.io/lts/en-us/) FLV to the DVR

## Installation

```yaml
services:
  srs:
    ...
    environment:
      SRS_VHOST_HTTP_HOOKS_ON_DVR: http://dvr:3001/v1/azure
    volumes:
      - ./data:/data

  dvr:
    image: ghcr.io/offkai/srs-dvr:main
    restart: unless-stopped
    environment:
      PORT: 3001 # Optional, if you need to run on another port
      METRICS_PORT: 3002 # Same as above but for metrics
      # Must match the `dvr_path` root in the SRS config
      # Examples:
      #     /data/[app]/[stream]/[timestamp].flv;       -> "/data"
      #     /other/path/[app]/[stream]/[timestamp].flv; -> "/other/path"
      DVR_DATA_ROOT: "/data"
      DVR_DEFAULT_STORAGE: "azure"
      DVR_AZURE_CONNECTION_STRING: <secret>
      DVR_AZURE_CONTAINER_NAME: "dvr"
    volumes:
      - ./data:/data
      - ./dvr:/dvr
    ports:
        - 127.0.0.1:3001:3001/tcp # API server
        - 127.0.0.1:3002:3002/tcp # Prometheus metrics
```

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

# for MacOS
sed -i "" "s/^CANDIDATE=.*/CANDIDATE=\"$(ifconfig en0 inet | grep 'inet ' | awk '{print $2}')\"/" .env
# for Linux
sed -i "s/^CANDIDATE=.*/CANDIDATE=\"$(ifconfig eth0 | grep 'inet ' | awk '{print $2}')\"/" .env

docker compose -f compose.srs.yml up -d

# If you want metrics (available at http://localhost:3000/)
docker compose -f compose.grafana.yml up -d
```

You can then run the DVR with `yarn dev` and test the webhook with `yarn stream sd inf` in another terminal which will run an ffmpeg command to the SRS. You can check the scripts dir for more info.
