# Simple Realtime Server Digital Video Recorder

Upload [SRS](https://ossrs.io/lts/en-us/) recordings to the cloud.

## Installation

### Docker compose

```yaml
# compose.yml
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
    volumes:
      - ./dvr.config.yaml:/etc/dvr/dvr.config.yaml:ro
      - ./recordings:/recordings
    ports:
        - 127.0.0.1:3001:3001/tcp # API server
        - 127.0.0.1:3002:3002/tcp # Prometheus metrics
    healthcheck:
      test: wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/ping || exit 1
      interval: 60s
      timeout: 30s
      retries: 5
      start_period: 20s
```

## Configuration

Config path: `/etc/dvr/dvr.config.yaml`

### Notes

- Values with angle brackets are required (ie `<string>`).
- Values with square brackets are optional (ie `[string]`).
- Default values are noted after the equals sign (ie default for `[string=test]` is `test`).

```yaml
dvr:
  # Port the HTTP server should listen on
  port: [integer=3001]

metrics:
  # Enable or disable metrics collection
  enabled: [boolean=false]
  # Port the metrics server should listen on
  port: [integer=3002]

storage:
  # Enable automatic cleanup of uploaded files
  autoCleanup: [boolean=true]
  # Base path that SRS recordings are written to
  # Example:
  #     /data/[app]/[stream]/[timestamp].flv;       -> /data
  #     /other/path/[app]/[stream]/[timestamp].flv; -> /other/path
  dataRoot: <string>
  # Default storage provider to use
  defaultStorage: <enum> # one of: azure, s3
  azure:
    # Azure Blob Storage account name
    accountName: <string>
    # Azure Blob Storage account key
    accountKey: <string>
    # Azure Blob Storage container to upload to
    containerName: <string>
    # Access tier for uploaded files
    # reference: https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview
    accessTier: [enum=default] # one of: default, hot, cool, cold, archive
  s3:
    accessKey: <string>
    secretKey: <string>
    bucket: <string>
    endpoint: <string>
    region: <string>
    # Storage class for uploaded files
    storageClass: [enum=DEFAULT] # one of: DEFAULT, STANDARD, REDUCED_REDUNDANCY, STANDARD_IA, ONEZONE_IA, INTELLIGENT_TIERING, GLACIER, DEEP_ARCHIVE, OUTPOSTS, GLACIER_IR, SNOW, EXPRESS_ONEZONE
    # If compatibility options for MinIO should be enabled
    minio: true
```

### Env var substitution

The config file also supports basic environment variable substitution, which is showcased below.

```sh
# .env
DVR_PORT="4000"
```

```yaml
# dvr.config.yaml
dvr:
  port: ${DVR_PORT} # resolves to: 4000
```

### Query parameters

It is also possible to change how the DVR handles webhooks depending on the query params appended to your SRS ingest URL.

Example:

```
rtmp://localhost:1935/app/stream?dvr=true&start=1746915970
```

| Query param | Description                                                                                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dvr`       | Setting this to `false` will disable all uploads, any other value will allow it. Files are still removed.                                                                                 |
| `start`     | A [Unix timestamp](https://www.unixtimestamp.com/) of when the DVR is allowed to start uploading files. Any webhook request _before_ this time will get dropped. Files are still removed. |

## Contributing

### Tools

- [Node.js (v22.x)](https://nodejs.org/en)
- [Yarn (v4+)](https://yarnpkg.com/)
- [Docker](https://docs.docker.com/)
- [FFmpeg](https://www.ffmpeg.org/)

### Environment

Run the following commands to bootstrap the local environment:

```sh
# Copy the example files and provide proper values
cp .env.example .env
cp dvr.example.yaml dvr.config.yaml

# Set candidate for WebRTC, you can check source before running the script
./scripts/set-candidate.sh

# Start a local SRS
docker compose -f compose.srs.yml up -d

# If you want metrics (available at http://localhost:3000/)
docker compose -f compose.grafana.yml up -d
```

You can then run the DVR with `yarn dev` and test the webhook with `yarn stream sd inf` in another terminal which will run an ffmpeg command to SRS. You can check the [script](/scripts/stream.sh) for more info.

More info about the candidate setting: <https://ossrs.io/lts/en-us/docs/v6/doc/webrtc#config-candidate>

#### Development on MacOS

Since some of the compose files use `network_mode: host`, you'll need to find a method to run containers that supports that.
