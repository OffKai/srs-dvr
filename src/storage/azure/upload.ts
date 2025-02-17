import { rm } from 'node:fs/promises';
import { createReadStream, ReadStream } from 'node:fs';
import { setTimeout } from 'node:timers';
import { server } from '../../server.js';
import { getAzureContainerClient } from './client.js';
import type { UploadFunc } from '../../lib/types/srs.js';

const BLOCK_BUFFER_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_CONCURRENCY = 5;
const MAX_RETRIES = 5;

const azureClient = await getAzureContainerClient();

/**
 * Upload a file to Azure Blob Storage
 * @param filename - The name of the file
 * @param path - The path to the file
 */
export const azureUpload: UploadFunc = async (uploadPath, filePath, options) => {
	let attempt = 1;
	const blockClient = azureClient.getBlockBlobClient(uploadPath);

	const execute = async () => {
		server.log.info(`uploading file (${attempt}): ${filePath}`);
		server.metrics?.upload.attempt.inc({ storage: 'azure' });

		let stream: ReadStream | undefined;
		try {
			// Setting bufferSize and highWaterMark to the same value is recommended
			stream = createReadStream(filePath, { highWaterMark: BLOCK_BUFFER_SIZE_BYTES });
			await blockClient.uploadStream(stream, BLOCK_BUFFER_SIZE_BYTES, MAX_CONCURRENCY);
		} catch (err: unknown) {
			stream?.destroy(); // TODO - Check if it's destroyed in the azure package

			server.log.error(err, `failed to upload file (${attempt}): ${filePath}`);

			if (attempt >= MAX_RETRIES) {
				server.log.error(`failed to upload file after ${MAX_RETRIES} attempts: ${filePath}`);
				server.metrics?.upload.failure.inc({ storage: 'azure' });

				if (options?.onComplete) {
					await options.onComplete();
				}

				return;
			}

			server.log.warn(`retrying upload (${attempt}): ${filePath}`);

			const delay = 1000 * Math.pow(2, attempt);
			attempt += 1;

			setTimeout(async () => {
				await execute();
			}, delay);

			return;
		}

		try {
			await rm(filePath);
		} catch (err: unknown) {
			server.log.error(err, `failed to delete file: ${filePath}`);
		}

		server.log.info(`file uploaded (${attempt}): ${filePath}`);
		server.metrics?.upload.success.inc({ storage: 'azure' });

		if (options?.onComplete) {
			await options.onComplete();
		}
	};

	await execute();
};
