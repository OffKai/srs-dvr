import type { FastifyPluginAsync } from 'fastify';
import { DvrWebhookPayloadSchema } from './lib/types.js';
import { basename, resolve } from 'node:path';
import { upload } from './lib/azure.js';

export const routes: FastifyPluginAsync = async (server) => {
	server.get('/ping', async (_, res) => {
		await res.status(200).send({ message: 'OK' });
	});

	server.post('/v1/azure', async (req, res) => {
		const payload = DvrWebhookPayloadSchema.safeParse(req.body);
		if (!payload.success) {
			return await res.status(400).send({ code: 1 });
		}

		await res.status(200).send({ code: 0 });

		const path = resolve(`.${payload.data.file}`);
		const filename = basename(payload.data.file);
		await upload(filename, path);
	});

	server.log.info('Routes loaded');
};
