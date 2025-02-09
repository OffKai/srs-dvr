import type { FastifyPluginAsync } from 'fastify';
import { azureRoutes } from './lib/storage/azure.routes.js';

export const routes: FastifyPluginAsync = async (server) => {
	await server.register(azureRoutes);

	server.get('/ping', async (_, res) => {
		await res.status(200).send({ message: 'OK' });
	});

	server.get('/metrics', async (_, res) => {
		if (server.metrics === undefined) {
			await res.status(501).send({ message: 'Metrics are not enabled' });
			return;
		}

		const metrics = await server.metrics.collect();
		await res
			.status(200) //
			.header('content-type', server.metrics.contentType)
			.send(metrics);
	});

	server.log.info('Routes loaded');
};
