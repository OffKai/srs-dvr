import { azureUpload } from './upload.js';
import { resolveFilePath, fmtUploadPath, verifyFilePath } from '../../lib/utils/fs.js';
import { DvrWebhookSchema } from '../../lib/utils/constants.js';
import { basename } from 'node:path';
import type { FastifyPluginCallback } from 'fastify';
import type { DvrWebhookPayload, TrackerEntry } from '../../lib/types/srs.js';

export const azureRoutes: FastifyPluginCallback = (server) => {
	server.post<{ Body: DvrWebhookPayload }>(
		'/v1/azure', //
		{
			schema: { body: { $ref: DvrWebhookSchema.$id } },
			attachValidation: true
		},
		async (req, res) => {
			// Send custom response for validation errors
			if (req.validationError) {
				return await res.status(400).send({ code: 1 });
			}

			// Get the path and make sure it exists
			const path = resolveFilePath(req.body.file);
			if (path === null || !verifyFilePath(path)) {
				server.log.error(`invalid file path: ${path}`);
				return await res.status(400).send({ code: 1 });
			}

			// Return if it's already being processed
			if (server.tracker.has(path)) {
				server.log.error(`file already being uploaded: ${path}`);
				return await res.status(400).send({ code: 1 });
			}

			await res.status(200).send({ code: 0 });

			const recording: TrackerEntry = {
				app: req.body.app,
				stream: req.body.stream,
				filename: basename(path),
				path,
				storage: 'azure',
				date: new Date().toISOString()
			};

			server.tracker.set(path, recording);

			const uploadPath = fmtUploadPath({
				app: recording.app,
				stream: recording.stream,
				filename: recording.filename
			});

			server.metrics?.upload.attempt.inc({ storage: 'azure' });

			await azureUpload(uploadPath, path, {
				onProgress: ({ bytes }) => {
					server.metrics?.upload.bytes.inc({ storage: 'azure' }, bytes);
				},
				onComplete: () => {
					server.metrics?.upload.success.inc({ storage: 'azure' });
					server.tracker.delete(path);
				},
				onFailure: () => {
					server.metrics?.upload.failure.inc({ storage: 'azure' });
					server.tracker.delete(path);
				}
			});
		}
	);
};
