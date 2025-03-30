import { azureUpload } from './upload.js';
import { getFilePath, fmtUploadPath, verifyFilePath } from '../../lib/utils/fs.js';
import { DvrWebhookSchema } from '../../lib/utils/constants.js';
import { basename } from 'node:path';
import type { FastifyPluginAsync } from 'fastify';
import type { DvrWebhookPayload, TrackerVideo } from '../../lib/types/srs.js';

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
				server.log.error(`invalid file path: ${path}`);
				return await res.status(400).send({ code: 1 });
			}

			if (server.tracker.has(path)) {
				server.log.error(`file already being uploaded: ${path}`);
				return await res.status(400).send({ code: 1 });
			}

			const video: TrackerVideo = {
				app: req.body.app,
				stream: req.body.stream,
				filename: basename(path),
				path,
				storage: 'azure',
				date: new Date().toISOString()
			};

			server.tracker.set(path, video);

			await res.status(200).send({ code: 0 });

			const uploadPath = fmtUploadPath({
				app: video.app,
				stream: video.stream,
				filename: video.filename
			});

			const cleanup = (): void => {
				server.tracker.delete(path);
			};

			await azureUpload(uploadPath, path, {
				onProgress: ({ bytes }) => {
					server.metrics?.upload.bytes.inc({ storage: 'azure' }, bytes);
				},
				onComplete: cleanup,
				onFailure: cleanup
			});
		}
	);
};
