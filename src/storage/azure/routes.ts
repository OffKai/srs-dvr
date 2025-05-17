import { azureUpload } from './upload.js';
import { fmtUploadPath } from '../../lib/utils/fs.js';
import { DvrWebhookSchema } from '../../lib/utils/constants.js';
import { basename } from 'node:path';
import { rm } from 'node:fs/promises';
import type { FastifyPluginCallback } from 'fastify';
import type { DvrWebhookPayload } from '../../lib/types/srs.js';
import type { TrackerEntry } from '../../lib/types/dvr.js';

export const azureRoutes: FastifyPluginCallback = (server) => {
	server.post<{ Body: DvrWebhookPayload }>(
		'/v1/azure',
		{
			schema: { body: { $ref: DvrWebhookSchema.$id } },
			attachValidation: true
		},
		async (req, res) => {
			await res.status(200).send({ code: 0 });

			const path = req.requestContext.get('path');
			if (!path) {
				server.log.error('missing path in request context');
				return await res.status(500).send({ message: 'internal server error' });
			}

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
				onComplete: () => {
					server.metrics?.upload.success.inc({ storage: 'azure' });
					server.tracker.delete(path);
				},
				onFailure: () => {
					server.metrics?.upload.failure.inc({ storage: 'azure' });
					server.tracker.delete(path);
				}
			});

			if (server.config.storage.autoCleanup) {
				try {
					await rm(path);
				} catch (err: unknown) {
					server.log.error(err, `failed to delete file: ${path}`);
				}
			}
		}
	);
};
