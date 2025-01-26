import type { FastifyPluginAsync } from 'fastify';

export const routes: FastifyPluginAsync = async (server) => {
	server.get('/ping', async (req, res) => {
		await res.status(200).send({ message: 'OK' });
	});

	server.log.info('Routes loaded');
};
