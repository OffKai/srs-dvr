import { azureRoutes } from './azure/routes.js';
import { s3Routes } from './s3/routes.js';
import { storagePreHandlerHook } from './handlers.js';
import type { FastifyPluginAsync } from 'fastify';

export const storageRoutes: FastifyPluginAsync = async (server) => {
	server.addHook('preHandler', storagePreHandlerHook);

	await server.register(azureRoutes);
	await server.register(s3Routes);

	server.log.info('storage routes loaded');
};
