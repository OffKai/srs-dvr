import { DvrWebhookSchema } from '../../lib/utils/constants.js';
import { basename } from 'node:path';
import type { FastifyPluginCallback } from 'fastify';
import type { DvrWebhookPayload, TrackerEntry } from '../../lib/types/srs.js';
import { fmtUploadPath } from '../../lib/utils/fs.js';
import { rm } from 'node:fs/promises';
import { s3Upload } from './upload.js';

export const s3Routes: FastifyPluginCallback = (server) => {
	server.post<{ Body: DvrWebhookPayload }>(
		'/v1/s3',
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
				storage: 's3',
				date: new Date().toISOString()
			};

			server.tracker.set(path, recording);

			const uploadPath = fmtUploadPath({
				app: recording.app,
				stream: recording.stream,
				filename: recording.filename
			});

			server.metrics?.upload.attempt.inc({ storage: 's3' });

			await s3Upload(uploadPath, path, {
				onComplete: () => {
					server.metrics?.upload.success.inc({ storage: 's3' });
					server.tracker.delete(path);
				},
				onFailure: () => {
					server.metrics?.upload.failure.inc({ storage: 's3' });
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
