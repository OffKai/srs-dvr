import { config } from './lib/utils/config.js';
import { isDev } from './lib/utils/constants.js';
import { routes } from './routes.js';
import { server } from './server.js';

const start = async (): Promise<void> => {
	try {
		await server.register(routes);

		await server.listen({
			host: isDev ? '127.0.0.1' : '0.0.0.0',
			port: config.PORT
		});

		server.log.info(`Environment: ${process.env.NODE_ENV}`);
		server.log.info(`Version:     ${config.VERSION}`);
		server.log.info(`Metrics:     ${config.DVR_METRICS ? 'enabled' : 'disabled'}`);
	} catch (err: unknown) {
		server.log.error(err);
		process.exit(1);
	}
};

await start();
