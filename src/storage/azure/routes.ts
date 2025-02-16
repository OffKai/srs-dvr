import { azureUpload } from './upload.js';
import { getFilePath, fmtUploadPath, tracker, verifyFilePath } from '../../lib/utils/fs.js';
import { DvrWebhookSchema } from '../../lib/utils/constants.js';
import type { FastifyPluginAsync } from 'fastify';
import type { DvrWebhookPayload } from '../../lib/types/srs.js';
import { basename } from 'node:path';

export const azureRoutes: FastifyPluginAsync = async (server) => {
	server.post<{ Body: DvrWebhookPayload }>(
		'/v1/azure', //
		{
			schema: { body: { $ref: DvrWebhookSchema.$id } },
			attachValidation: true
		},
		async (req, res) => {
			if (req.validationError) {
				return await res.status(400).send({ code: 1 });
			}

			const path = getFilePath(req.body.file);
			const isValid = verifyFilePath(path);
			if (!isValid) {
				server.log.error(`Invalid file path: ${path}`);
				return await res.status(400).send({ code: 1 });
			}

			if (await tracker.has(path)) {
				server.log.error(`File already being uploaded: ${path}`);
				return await res.status(400).send({ code: 1 });
			}

			await tracker.add({
				app: req.body.app,
				stream: req.body.stream,
				filename: basename(path),
				path,
				storage: 'azure',
				date: new Date().toISOString()
			});

			await res.status(200).send({ code: 0 });

			const uploadPath = fmtUploadPath({
				app: req.body.app,
				stream: req.body.stream,
				filename: basename(path)
			});
			await azureUpload(uploadPath, path, {
				onComplete: async () => {
					await tracker.remove(path);
				}
			});
		}
	);
};
