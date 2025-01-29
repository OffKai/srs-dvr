import type { FastifyPluginAsync } from 'fastify';
import { DvrWebhookPayloadSchema } from './lib/types.js';
import { resolve } from 'node:path';
import { stat } from 'node:fs/promises';

export const routes: FastifyPluginAsync = async (server) => {
	server.get('/ping', async (_, res) => {
		await res.status(200).send({ message: 'OK' });
	});

	server.post('/v1/s3', async (_, res) => {
		await res.status(200).send({ message: 'OK' });
	});

	server.post('/v1/azure', async (req, res) => {
		const payload = DvrWebhookPayloadSchema.safeParse(req.body);
		if (!payload.success) {
			return await res.status(400).send({ code: 1 });
		}

		const path = resolve(`.${payload.data.file}`);
		const stats = await stat(path);

		server.log.info(`File size: ${(stats.size / 1024).toFixed(2)} KB`);

		await res.status(200).send({ code: 0 });
	});

	server.log.info('Routes loaded');
};
