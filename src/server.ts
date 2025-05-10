import { fastify } from 'fastify';
import { DvrWebhookSchema, isDev } from './lib/utils/constants.js';
import { DvrMetrics } from './lib/utils/metrics.js';
import { loadConfig } from './lib/config/load.js';
import { fastifyRequestContext } from '@fastify/request-context';

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
	server.log.info('config loaded');

	server.decorate('config', cfg);
	server.decorate('tracker', new Map());

	if (cfg.metrics.enabled) {
		server.decorate('metrics', new DvrMetrics());
	}

	server.addSchema(DvrWebhookSchema);

	await server.register(fastifyRequestContext);

	return server;
}

export const server = await buildServer();
