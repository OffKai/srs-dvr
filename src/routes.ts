import type { FastifyPluginAsync } from 'fastify';
import { basename } from 'node:path';
import { upload } from './lib/storage/azure.js';
import { getFilePath, verifyFilePath } from './lib/utils/fs.js';
import type { DvrWebhookPayload } from './lib/types/srs.js';

export const routes: FastifyPluginAsync = async (server) => {
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

	server.post<{ Body: DvrWebhookPayload }>(
		'/v1/azure', //
		{
			schema: { body: { $ref: 'DvrWebhookPayload' } },
			attachValidation: true
		},
		async (req, res) => {
			if (req.validationError) {
				return await res.status(400).send({ code: 1 });
			}

			const path = getFilePath(req.body.file);
			const isValid = verifyFilePath(path);
			if (!isValid) {
				return await res.status(400).send({ code: 1 });
			}

			await res.status(200).send({ code: 0 });

			const filename = basename(req.body.file);
			await upload(filename, path);
		}
	);

	server.log.info('Routes loaded');
};
