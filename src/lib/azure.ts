import { BlobServiceClient } from '@azure/storage-blob';
import { rm } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { setTimeout } from 'node:timers';
import { server } from '../server.js';

const blobClient = BlobServiceClient.fromConnectionString(process.env.AZURE_CONNECTION_STRING!);

const azureClient = blobClient.getContainerClient(process.env.DVR_CONTAINER_NAME!);

/**
 * Upload a file to Azure Blob Storage
 * @param filename - The name of the file
 * @param path - The path to the file
 */
export const upload = async (filename: string, path: string): Promise<void> => {
	let attempt = 1;
	const blockClient = azureClient.getBlockBlobClient(filename);
	const stream = createReadStream(path);

	const execute = async () => {
		server.log.info(`Uploading file (${attempt}): ${path}`);

		try {
			await blockClient.uploadStream(stream);
		} catch (err: unknown) {
			server.log.error(err, `Failed to upload file (${attempt})`);

			if (attempt >= 5) {
				server.log.error(`Failed to upload file after 5 attempts: ${path}`);
				return;
			}

			server.log.warn(`Retrying upload (${attempt}): ${path}`);

			const delay = 1000 * Math.pow(2, attempt - 1); // TODO - Tweak values
			attempt += 1;

			setTimeout(async () => {
				await execute();
			}, delay);

			return;
		}

		try {
			await rm(path);
		} catch (err: unknown) {
			server.log.error(err, 'Failed to delete file:');
		}

		server.log.info(`File uploaded (${attempt}): ${path}'`);
	};

	await execute();
};
