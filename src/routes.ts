import { reloadConfig } from './lib/config/load.js';
import { restartUploads } from './lib/utils/uploads.js';
import { azureRoutes } from './storage/azure/routes.js';
import type { FastifyPluginAsync } from 'fastify';

export const routes: FastifyPluginAsync = async (server) => {
	await server.register(azureRoutes);

	server.get('/ping', async (_, res) => {
		await res.status(200).send('OK');
	});

	server.post('/retry', async (_, res) => {
		server.log.info('retrying uploads');

		try {
			await restartUploads();
			await res.status(200).send();
		} catch (err: unknown) {
			server.log.error(err);
			await res.status(500).send();
		}
	});

	server.post('/reload', async (_, res) => {
		server.log.info('reloading config');

		reloadConfig();

		await res.status(200).send();
	});

	server.log.info('routes loaded');
};
