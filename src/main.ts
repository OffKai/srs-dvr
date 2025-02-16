import { isDev } from './lib/utils/constants.js';
import { tracker } from './lib/utils/fs.js';
import { restartUploads } from './lib/utils/uploads.js';
import { routes } from './routes.js';
import { server } from './server.js';

const start = async (): Promise<void> => {
	try {
		await tracker.init();
		await server.register(routes);

		const host = isDev ? '127.0.0.1' : '0.0.0.0';
		await server.listen({
			host,
			port: server.config.PORT
		});
		await server.metrics?.listen({
			host,
			port: server.config.METRICS_PORT
		});

		await restartUploads();

		server.log.info('API');
		server.log.info(`  Environment: ${process.env.NODE_ENV}`);
		server.log.info(`  Version:     ${server.config.VERSION}`);
		server.log.info('Metrics');
		server.log.info(`  Status:      ${server.config.DVR_METRICS_ENABLED ? 'enabled' : 'disabled'}`);
		server.log.info(`  Endpoint:    http://${host}:${server.config.METRICS_PORT}/metrics`);
	} catch (err: unknown) {
		server.log.error(err);

		await server.close();
		await server.metrics?.shutdown();
		process.exit(1);
	}
};

await start();
