import { rm } from 'node:fs/promises';
import { createReadStream, ReadStream } from 'node:fs';
import { server } from '../../server.js';
import { getAzureContainerClient } from './client.js';
import type { UploadFunc } from '../../lib/types/srs.js';
import type { BlockBlobUploadStreamOptions } from '@azure/storage-blob';

const BLOCK_BUFFER_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_CONCURRENCY = 5;

const azureClient = await getAzureContainerClient();

/**
 * Upload a file to Azure Blob Storage
 * @param filename - The name of the file
 * @param path - The path to the file
 */
export const azureUpload: UploadFunc = async (uploadPath, filePath, options) => {
	const blockClient = azureClient.getBlockBlobClient(uploadPath);

	const execute = async (): Promise<void> => {
		server.log.info(`uploading file: ${filePath}`);

		let stream: ReadStream | undefined;
		try {
			// Setting bufferSize and highWaterMark to the same value is recommended
			stream = createReadStream(filePath, { highWaterMark: BLOCK_BUFFER_SIZE_BYTES });

			const opts: BlockBlobUploadStreamOptions = {};

			// `default` uses the account's access tier, so we don't need to set it
			if (server.config.storage.azure.accessTier !== 'default') {
				opts.tier = server.config.storage.azure.accessTier;
			}

			// Don't need to provide a callback if we don't need it
			if (options?.onProgress) {
				let progress = 0;

				opts.onProgress = ({ loadedBytes }) => {
					// ref: https://github.com/Azure/azure-sdk-for-js/blob/92e38f91570ed143982c832361f894aae287db63/sdk/storage/storage-blob/src/Clients.ts#L4398
					options.onProgress!({ bytes: loadedBytes - progress });
					progress = loadedBytes;
				};
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

		if (server.config.storage.autoCleanup) {
			try {
				await rm(filePath);
			} catch (err: unknown) {
				server.log.error(err, `failed to delete file: ${filePath}`);
			}
		}

		server.log.info(`file uploaded: ${filePath}`);

		if (options?.onComplete) {
			await options.onComplete();
		}
	};

	await execute();
};
