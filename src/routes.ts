import type { FastifyPluginAsync } from 'fastify';
import { azureRoutes } from './lib/storage/azure.routes.js';

export const routes: FastifyPluginAsync = async (server) => {
	await server.register(azureRoutes);

	server.get('/ping', async (_, res) => {
		await res.status(200).send({ message: 'OK' });
	});

	server.log.info('Routes loaded');
};
