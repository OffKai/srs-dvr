# SRS DVR

Upload SRS FLV to the DVR

## Dev environment

Run the following commands to bootstrap the local environment:

```sh
cp .env.example .env
sed -i "s/^CANDIDATE=.*/CANDIDATE=$(ifconfig eth0 | grep 'inet ' | awk '{print $2}')/" .env
docker compose -f compose.srs.yml up -d

# If you want metrics available, which would be available at http://localhost:3000/
docker compose -f compose.grafana.yml up -d
```
