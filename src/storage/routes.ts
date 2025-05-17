import { azureRoutes } from './azure/routes.js';
import { s3Routes } from './s3/routes.js';
import { storagePreHandlerHook } from './handlers.js';
import type { FastifyPluginAsync } from 'fastify';
import type { AzureConfig, S3Config } from '../lib/config/schema.js';

export const storageRoutes: FastifyPluginAsync = async (server) => {
	server.addHook('preHandler', storagePreHandlerHook);

	const azureConfig = await new Promise<AzureConfig>((res) => {
		res(server.getProviderConfig('azure'));
	}).catch(() => null);
	const s3Config = await new Promise<S3Config>((res) => {
		res(server.getProviderConfig('s3'));
	}).catch(() => null);

	if (azureConfig) {
		await server.register(azureRoutes);
	}

	if (s3Config) {
		await server.register(s3Routes);
	}

	server.log.info('storage routes loaded');
};
