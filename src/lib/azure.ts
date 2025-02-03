import { BlobServiceClient } from '@azure/storage-blob';
import { rm } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { setTimeout } from 'node:timers';
import { server } from '../server.js';

const blobClient = BlobServiceClient.fromConnectionString(process.env.AZURE_CONNECTION_STRING!);

const azureClient = blobClient.getContainerClient('srs-dvr');

export const upload = async (filename: string, path: string): Promise<void> => {
	let attempt = 1;
	const blockClient = azureClient.getBlockBlobClient(filename);
	const stream = createReadStream(path);

	const execute = async () => {
		server.log.info(`Uploading file (${attempt}):`, filename);

		try {
			await blockClient.uploadStream(stream); // Test passes without await???
		} catch (err: unknown) {
			server.log.error(`Failed to upload file (${attempt}):`, err);

			if (attempt > 5) {
				server.log.error('Failed to upload file after 5 attempts:', filename);
				return;
			}

			server.log.warn(`Retrying upload (${attempt}):`, filename);

			const delay = 1000 * Math.pow(2, attempt - 1); // Tweak values
			attempt += 1;
			setTimeout(async () => {
				console.log('EXECUTE');
				await execute();
			}, delay);
			return;
		}

		try {
			await rm(path);
		} catch (err: unknown) {
			server.log.error('Failed to delete file:', err);
		}

		server.log.info(`File uploaded (${attempt}):'`, filename);
	};

	await execute();
};
