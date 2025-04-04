# Simple Realtime Server Digital Video Recorder

Upload [SRS](https://ossrs.io/lts/en-us/) recordings to the cloud.

## Installation

### Docker compose

```yaml
services:
  srs:
    image: ossrs/srs:v6
    ...
    environment:
      SRS_VHOST_HTTP_HOOKS_ON_DVR: http://dvr:3001/v1/azure
    volumes:
      - ./recordings:/data

  dvr:
    image: ghcr.io/offkai/srs-dvr:latest
    restart: unless-stopped
    environment:
      # Must match the `dvr_path` root in the SRS config
      # Examples:
      #     /data/[app]/[stream]/[timestamp].flv;       -> "/data"
      #     /other/path/[app]/[stream]/[timestamp].flv; -> "/other/path"
      DVR_DATA_ROOT: "/data"
      DVR_DEFAULT_STORAGE: "azure"
      DVR_AZURE_ACCOUNT_NAME: <secret>
      DVR_AZURE_ACCOUNT_KEY: <secret>
      DVR_AZURE_CONTAINER_NAME: "dvr"
    volumes:
      # Mount directory needs to match `DVR_DATA_ROOT`
      - ./recordings:/data
    ports:
        - 127.0.0.1:3001:3001/tcp # API server
        - 127.0.0.1:3002:3002/tcp # Prometheus metrics
```

### Config

| Environment variable  | Required | Default | Description                                                                              |
| --------------------- | -------- | ------- | ---------------------------------------------------------------------------------------- |
| `PORT`                |          | 3001    | The port for the API server to use.                                                      |
| `METRICS_PORT`        |          | 3002    | The port for the metrics server to use.                                                  |
| `DVR_METRICS_ENABLED` |          | false   | If [Prometheus](https://prometheus.io/) metrics should be enabled.                       |
| `DVR_DATA_ROOT`       | ✓        |         | The path root to check for recordings. Must match the `dvr_path` root in the SRS config. |
| `DVR_DISABLE_CLEANUP` |          | false   | Disable file deletions after a successful upload.                                        |
| `DVR_DEFAULT_STORAGE` | ✓        |         | The default storage provider to use, notably for uploads on restart. One of: `azure`.    |

#### Azure config

| Environment variable       | Required | Default | Description                                                                                                                                     |
| -------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `DVR_AZURE_ACCOUNT_NAME`   | ✓        |         | The name of the Azure blob storage account.                                                                                                     |
| `DVR_AZURE_ACCOUNT_KEY`    | ✓        |         | An access key for the Azure blob storage account.                                                                                               |
| `DVR_AZURE_CONTAINER_NAME` | ✓        |         | The name of the Azure blob storage container to use.                                                                                            |
| `DVR_AZURE_ACCESS_TIER`    |          |         | The storage access tier to use, defaults to account setting. See: <https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview> |

## Contributing

### Tools

- [Node.js (v22.x)](https://nodejs.org/en)
- [Yarn (v4+)](https://yarnpkg.com/)
- [Docker](https://docs.docker.com/)
- [FFmpeg](https://www.ffmpeg.org/)

### Environment

Run the following commands to bootstrap the local environment:

```sh
# Copy the example dotenv file and provide proper values
cp .env.example .env

# Set candidate for WebRTC
./scripts/set-candidate.sh

# Start a local SRS
docker compose -f compose.srs.yml up -d

# If you want metrics (available at http://localhost:3000/)
docker compose -f compose.grafana.yml up -d
```

You can then run the DVR with `yarn dev` and test the webhook with `yarn stream sd inf` in another terminal which will run an ffmpeg command to SRS. You can check the [script](/scripts/stream.sh) for more info.

More info about the candidate setting: <https://ossrs.io/lts/en-us/docs/v6/doc/webrtc#config-candidate>
