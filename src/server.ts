import Fastify from 'fastify';
import { isDev, isTesting } from './lib/constants.js';

export function buildServer() {
	const server = Fastify({
		disableRequestLogging: !isDev,
		logger: {
			level: isTesting //
				? 'warn'
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

	return server;
}
