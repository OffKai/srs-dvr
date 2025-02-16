import { azureRoutes } from './storage/azure/routes.js';
import type { FastifyPluginAsync } from 'fastify';

export const routes: FastifyPluginAsync = async (server) => {
	await server.register(azureRoutes);

	server.get('/ping', async (_, res) => {
		await res.status(200).send('OK');
	});

	server.log.info('Routes loaded');
};
