import Fastify from 'fastify';
import { isDev, isTesting } from './lib/utils/constants.js';
import { DvrMetrics } from './lib/utils/metrics.js';
import { config } from './lib/utils/config.js';
import type { DvrWebhookPayload } from './lib/types/srs.js';

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

	if (config.DVR_METRICS) {
		server.decorate('metrics', new DvrMetrics());
	}

	server.addSchema({
		$id: 'DvrWebhookPayload',
		type: 'object',
		additionalProperties: false,
		required: [
			'file' //
		],
		properties: {
			server_id: { type: 'string' },
			service_id: { type: 'string' },
			action: { type: 'string' },
			client_id: { type: 'string' },
			ip: { type: 'string' },
			vhost: { type: 'string' },
			app: { type: 'string' },
			tcUrl: { type: 'string' },
			stream: { type: 'string' },
			param: { type: 'string' },
			cwd: { type: 'string' },
			file: { type: 'string' },
			stream_url: { type: 'string' },
			stream_id: { type: 'string' }
		} satisfies Record<keyof DvrWebhookPayload, unknown>
	});

	return server;
}

export const server = buildServer();
