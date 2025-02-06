import type { FastifyPluginAsync } from 'fastify';
import { basename } from 'node:path';
import { upload } from './lib/azure.js';
import { getFilePath, verifyFilePath } from './lib/fs.js';
import type { DvrWebhookPayload } from './lib/types.js';

export const routes: FastifyPluginAsync = async (server) => {
	server.get('/ping', async (_, res) => {
		await res.status(200).send({ message: 'OK' });
	});

	server.post<{ Body: DvrWebhookPayload }>(
		'/v1/azure', //
		{ schema: { body: { $ref: 'DvrWebhookPayload#' } }, attachValidation: true },
		async (req, res) => {
			if (req.validationError) {
				return await res.status(400).send({ code: 1 });
			}

			const path = getFilePath(req.body.file);
			const isValid = verifyFilePath(path);
			if (!isValid) {
				console.error(`Invalid path: ${path}`);
				return await res.status(400).send({ code: 1 });
			}

			await res.status(200).send({ code: 0 });

			const filename = basename(req.body.file);
			await upload(filename, path);
		}
	);

	server.log.info('Routes loaded');
};
