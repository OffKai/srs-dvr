import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { server } from '../../server.js';

const blobClient = BlobServiceClient.fromConnectionString(server.config.DVR_AZURE_CONNECTION_STRING);

export async function getAzureContainerClient(): Promise<ContainerClient> {
	const containerClient = blobClient.getContainerClient(server.config.DVR_AZURE_CONTAINER_NAME);

	const exists = await containerClient.exists();
	if (!exists) {
		throw new Error(`Blob container "${server.config.DVR_AZURE_CONTAINER_NAME}" does not exist`);
	}

	return containerClient;
}
