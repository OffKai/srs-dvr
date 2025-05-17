import { restartUploads } from './lib/utils/uploads.js';
import type { FastifyPluginAsync } from 'fastify';
import { storageRoutes } from './storage/routes.js';

export const routes: FastifyPluginAsync = async (server) => {
	await server.register(storageRoutes);

	server.get('/ping', async (_, res) => {
		await res.status(200).send('OK');
	});

	server.get('/routes', async (_, res) => {
		await res //
			.status(200)
			.header('Content-Type', 'text/plain; charset=utf-8')
			.send(server.printRoutes());
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
		await res.status(405).send();
	});

	server.log.info('routes loaded');
};
