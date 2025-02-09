import type { FastifyPluginAsync } from 'fastify';
import { basename } from 'node:path';
import { upload } from './azure.js';
import type { DvrWebhookPayload } from '../types/srs.js';
import { getFilePath, verifyFilePath } from '../utils/fs.js';

export const azureRoutes: FastifyPluginAsync = async (server) => {
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
