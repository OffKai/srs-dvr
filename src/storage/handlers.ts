import type { DvrWebhookPayload } from '../lib/types/srs.js';
import type { GenericPreHandler } from '../lib/types/fastify.js';
import { resolveFilePath, verifyFilePath } from '../lib/utils/fs.js';
import { server } from '../server.js';
import { rm } from 'node:fs/promises';
import { shouldUpload } from '../lib/utils/params.js';

export const storagePreHandlerHook: GenericPreHandler<{ Body: DvrWebhookPayload }> = async (req, res) => {
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

	if (!shouldUpload(req.body.param)) {
		await res.status(200).send({ code: 0 });

		if (server.config.storage.autoCleanup) {
			try {
				await rm(path);
			} catch (err: unknown) {
				server.log.error(err, `failed to delete file: ${path}`);
			}
		}

		return;
	}

	// Return if it's already being processed
	if (server.tracker.has(path)) {
		server.log.error(`file already being uploaded: ${path}`);
		return await res.status(400).send({ code: 1 });
	}

	req.requestContext.set('path', path);
};
