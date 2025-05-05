import { createReadStream, ReadStream } from 'node:fs';
import { server } from '../../server.js';
import type { UploadFunc } from '../../lib/types/srs.js';
import type { BlockBlobUploadStreamOptions } from '@azure/storage-blob';
import { azureClient } from './client.js';

const BLOCK_BUFFER_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_CONCURRENCY = 5;

/**
 * Upload a file to Azure Blob Storage
 * @param filename - The name of the file
 * @param path - The path to the file
 */
export const azureUpload: UploadFunc = async (uploadPath, filePath, options) => {
	const blockClient = azureClient.getBlockBlobClient(uploadPath);

	server.log.info(`uploading file: ${filePath}`);

	let stream: ReadStream | undefined;
	try {
		// Setting bufferSize and highWaterMark to the same value is recommended
		stream = createReadStream(filePath, { highWaterMark: BLOCK_BUFFER_SIZE_BYTES });

		const opts: BlockBlobUploadStreamOptions = {};

		// 'default' uses the account's access tier setting, so we don't need to set it
		if (server.config.storage.azure.accessTier !== 'default') {
			opts.tier = server.config.storage.azure.accessTier;
		}

		await blockClient.uploadStream(stream, BLOCK_BUFFER_SIZE_BYTES, MAX_CONCURRENCY, opts);
	} catch (err: unknown) {
		stream?.destroy();

		server.log.error(err, `failed to upload file: ${filePath}`);

		if (options?.onFailure) {
			await options.onFailure();
		}

		return;
	}

	server.log.info(`file uploaded: ${filePath}`);

	if (options?.onComplete) {
		await options.onComplete();
	}
};
