import { config } from './lib/utils/config.js';
import { isDev } from './lib/utils/constants.js';
import { routes } from './routes.js';
import { server } from './server.js';

const start = async (): Promise<void> => {
	try {
		await server.register(routes);

		const host = isDev ? '127.0.0.1' : '0.0.0.0';
		await server.metrics?.listen({
			host,
			port: config.METRICS_PORT
		});
		await server.listen({
			host,
			port: config.PORT
		});

		server.log.info('API');
		server.log.info(`  Environment: ${process.env.NODE_ENV}`);
		server.log.info(`  Version:     ${config.VERSION}`);
		server.log.info('Metrics');
		server.log.info(`  Status:      ${config.DVR_METRICS_ENABLED ? 'enabled' : 'disabled'}`);
		server.log.info(`  Endpoint:    http://${host}:${config.METRICS_PORT}/metrics`);
	} catch (err: unknown) {
		server.log.error(err);

		await server.close();
		await server.metrics?.shutdown();
		process.exit(1);
	}
};

await start();
