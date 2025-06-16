import type { AzureConfig, S3Config } from './lib/config/schema.js';
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

		await printInfo(host);

		if (server.config.storage.autoUpload) {
			await restartUploads();
		}
	} catch (err: unknown) {
		server.log.error(err);

		await server.close();
		await server.metrics?.shutdown();
		process.exit(1);
	}
};

const printInfo = async (host: string) => {
	const { dvr, metrics, storage } = server.config;

	const azureConfig = await new Promise<AzureConfig>((res) => {
		res(server.getProviderConfig('azure'));
	}).catch(() => null);
	const s3Config = await new Promise<S3Config>((res) => {
		res(server.getProviderConfig('s3'));
	}).catch(() => null);

	server.log.info('');
	server.log.info('API');
	server.log.info(`  Environment:     ${process.env.NODE_ENV}`);
	server.log.info(`  Version:         ${APP_VERSION}`);
	server.log.info(`  Endpoint:        http://${host}:${dvr.port}`);

	server.log.info('Metrics');
	server.log.info(`  Status:          ${metrics.enabled ? 'enabled' : 'disabled'}`);
	server.log.info(`  Endpoint:        http://${host}:${metrics.port}/metrics`);

	server.log.info('Storage');
	server.log.info(`  Default:         ${storage.defaultStorage}`);
	server.log.info(`  Data root:       ${storage.dataRoot}`);
	server.log.info(`  Auto-clean:      ${storage.autoCleanup ? 'enabled' : 'disabled'}`);
	server.log.info(`  Auto-upload:     ${storage.autoUpload ? 'enabled' : 'disabled'}`);

	server.log.info('Providers');

	if (azureConfig) {
		server.log.info('  Azure');
		server.log.info(`    Container:     ${azureConfig.containerName}`);
		server.log.info(`    Access tier:   ${azureConfig.accessTier}`);
	}

	if (s3Config) {
		server.log.info('  S3');
		server.log.info(`    Endpoint:      ${s3Config.endpoint}`);
		server.log.info(`    Bucket:        ${s3Config.bucket}`);
		server.log.info(`    Storage class: ${s3Config.storageClass}`);
		server.log.info(`    Region:        ${s3Config.region}`);
		server.log.info(`    MinIO compat:  ${s3Config.minio}`);
	}

	server.log.info('');
};

await start();
