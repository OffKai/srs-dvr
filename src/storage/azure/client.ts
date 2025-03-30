import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { server } from '../../server.js';

const blobClient = new BlobServiceClient(
	`https://${server.config.DVR_AZURE_ACCOUNT_NAME}.blob.core.windows.net`, //
	new StorageSharedKeyCredential(server.config.DVR_AZURE_ACCOUNT_NAME, server.config.DVR_AZURE_ACCOUNT_KEY),
	{
		retryOptions: {
			maxTries: 5
		},
		keepAliveOptions: {
			enable: true
		}
	}
);

export async function getAzureContainerClient(): Promise<ContainerClient> {
	const containerClient = blobClient.getContainerClient(server.config.DVR_AZURE_CONTAINER_NAME);

	const exists = await containerClient.exists();
	if (!exists) {
		throw new Error(`Blob container "${server.config.DVR_AZURE_CONTAINER_NAME}" does not exist`);
	}

	return containerClient;
}
