import { fastify } from 'fastify';
import { DvrWebhookSchema, isDev } from './lib/utils/constants.js';
import { DvrMetrics } from './lib/utils/metrics.js';
import { loadConfig } from './lib/config/load.js';
import { fastifyRequestContext } from '@fastify/request-context';
import type { StorageTypes } from './lib/types/dvr.js';

async function buildServer() {
	const server = fastify({
		disableRequestLogging: !isDev,
		logger: {
			level: isDev //
				? 'debug'
				: 'info',
			transport: {
				target: 'pino-pretty',
				options: {
					colorize: isDev,
					translateTime: 'HH:MM:ss Z',
					ignore: 'pid,hostname'
				}
			}
		}
	});

	const cfg = await loadConfig();
	server.decorate('config', cfg);

	if (!cfg.providers.azure && !cfg.providers.s3) {
		throw new Error('No storage provider configured');
	}

	server.log.info('config loaded');

	server.decorate('getProviderConfig', (provider: StorageTypes) => {
		switch (provider) {
			case 'azure': {
				if (!cfg.providers.azure) {
					throw new Error('Azure storage config is not defined');
				}

				return cfg.providers.azure;
			}
			case 's3': {
				if (!cfg.providers.s3) {
					throw new Error('S3 storage config is not defined');
				}

				return cfg.providers.s3;
			}
			default:
				throw new Error(`Unknown storage provider: ${provider}`);
		}
	});
	server.decorate('tracker', new Map());

	if (cfg.metrics.enabled) {
		server.decorate('metrics', new DvrMetrics());
	}

	server.addSchema(DvrWebhookSchema);

	await server.register(fastifyRequestContext);

	return server;
}

export const server = await buildServer();
