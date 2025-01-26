import { config } from './lib/config.js';
import { routes } from './routes.js';
import { buildServer } from './server.js';

const server = buildServer();

const start = async (): Promise<void> => {
	try {
		await server.register(routes);
		await server.listen({ host: '127.0.0.1', port: config.PORT });

		server.log.info(`Environment: ${process.env.NODE_ENV}`);
		server.log.info(`Version:     ${config.VERSION}`);
	} catch (err: unknown) {
		server.log.error(err);
		process.exit(1);
	}
};

await start();
