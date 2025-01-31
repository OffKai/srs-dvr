import { BlobServiceClient } from '@azure/storage-blob';
import { server } from '../server.js';
import { rm } from 'node:fs/promises';
import { setTimeout } from 'node:timers';
import { createReadStream } from 'node:fs';

const blobClient = BlobServiceClient.fromConnectionString(process.env.AZURE_CONNECTION_STRING!);

const azureClient = blobClient.getContainerClient('srs-dvr');

const retries = new Map<string, number>();

export const upload = async (filename: string, path: string): Promise<void> => {
	const blockClient = azureClient.getBlockBlobClient(filename);
	const stream = createReadStream(path);

	const execute = async () => {
		const attempt = retries.get(filename) ?? 0;
		server.log.info(`Uploading file (${attempt}):`, filename);

		try {
			await blockClient.uploadStream(stream);
		} catch (err: unknown) {
			server.log.error(`Failed to upload file (${attempt}):`, err);

			if (attempt >= 5) {
				server.log.error('Failed to upload file after 5 attempts:', filename);
				return;
			}

			retries.set(filename, attempt + 1);
			server.log.info(`Retrying upload (${attempt + 1}):`, filename);

			const delay = 1000 * Math.pow(2, attempt); // Tweak values
			setTimeout(execute, delay);
			return;
		}

		try {
			await rm(path);
		} catch (err: unknown) {
			server.log.error('Failed to delete file:', err);
			// Remove retry count?
		}

		retries.delete(filename);
	};

	await execute();
};
