import Fastify from 'fastify';
import { isDev, isTesting } from './lib/constants.js';

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

	server.addSchema({
		$id: 'DvrWebhookPayload',
		type: 'object',
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
		}
	});

	return server;
}

export const server = buildServer();
