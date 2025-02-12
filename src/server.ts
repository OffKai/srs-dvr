import Fastify from 'fastify';
import { DvrWebhookSchema, isDev, isTesting } from './lib/utils/constants.js';
import { DvrMetrics } from './lib/utils/metrics.js';
import { config } from './lib/utils/config.js';

function buildServer() {
	const server = Fastify({
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

	if (config.DVR_METRICS_ENABLED) {
		server.decorate('metrics', new DvrMetrics());
	}

	server.addSchema(DvrWebhookSchema);

	return server;
}

export const server = buildServer();
