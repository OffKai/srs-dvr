import { APP_VERSION, isDev } from './lib/utils/constants.js';
import { restartUploads } from './lib/utils/uploads.js';
import { routes } from './routes.js';
import { server } from './server.js';

const start = async (): Promise<void> => {
	try {
		await server.register(routes);

		const host = isDev ? '127.0.0.1' : '0.0.0.0';
		await server.listen({
			host,
			port: server.config.dvr.port
		});
		await server.metrics?.listen({
			host,
			port: server.config.metrics.port
		});

		printInfo(host);

		await restartUploads();
	} catch (err: unknown) {
		server.log.error(err);

		await server.close();
		await server.metrics?.shutdown();
		process.exit(1);
	}
};

const printInfo = (host: string) => {
	const { dvr, metrics, storage } = server.config;

	server.log.info('');
	server.log.info('API');
	server.log.info(`  Environment: ${process.env.NODE_ENV}`);
	server.log.info(`  Version:     ${APP_VERSION}`);
	server.log.info(`  Endpoint:    http://${host}:${dvr.port}`);
	server.log.info('Metrics');
	server.log.info(`  Status:      ${metrics.enabled ? 'enabled' : 'disabled'}`);
	server.log.info(`  Endpoint:    http://${host}:${metrics.port}/metrics`);
	server.log.info('Storage');
	server.log.info(`  Default:     ${storage.defaultStorage}`);
	server.log.info(`  Data root:   ${storage.dataRoot}`);
	server.log.info(`  Auto-clean:  ${storage.autoCleanup ? 'enabled' : 'disabled'}`);
	server.log.info('Azure');
	server.log.info(`  Access tier: ${storage.azure.accessTier}`);
	server.log.info('');
};

await start();
