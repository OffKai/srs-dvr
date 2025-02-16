## Base ##
FROM node:22.14.0-alpine3.21 AS base

RUN apk update --no-cache

## Builder ##
FROM base AS builder

WORKDIR /temp

COPY .yarn .yarn/
COPY .yarnrc.yml tsconfig.json yarn.lock package.json tsup.config.ts ./
COPY src/ src/

RUN yarn install --immutable && \
	yarn build:prod && \
	yarn workspaces focus --production

## App ##
FROM base AS app

LABEL org.opencontainers.image.source=https://github.com/OffKai/srs-dvr
LABEL org.opencontainers.image.licenses=Apache-2.0

ENV NODE_ENV=production

WORKDIR /dvr

COPY --from=builder /temp/node_modules node_modules/
COPY --from=builder /temp/dist dist/
COPY --from=builder /temp/package.json ./

EXPOSE 3001 3002

CMD ["node", "--enable-source-maps", "dist/main.js"]
