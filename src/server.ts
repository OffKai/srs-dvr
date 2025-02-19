import { fastify } from 'fastify';
import { DvrWebhookSchema, isDev, isTesting } from './lib/utils/constants.js';
import { DvrMetrics } from './lib/utils/metrics.js';
import { loadConfig } from './lib/utils/config.js';

function buildServer() {
	const server = fastify({
		disableRequestLogging: !isDev,
		logger: {
			level: isTesting //
				? 'silent'
				: isDev
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

	const cfg = loadConfig();
	server.decorate('config', cfg);
	server.decorate('tracker', new Map());

	if (cfg.DVR_METRICS_ENABLED) {
		server.decorate('metrics', new DvrMetrics());
	}

	server.addSchema(DvrWebhookSchema);

	return server;
}

export const server = buildServer();
