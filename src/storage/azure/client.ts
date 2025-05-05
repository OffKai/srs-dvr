import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { server } from '../../server.js';

const { azure } = server.config.storage;

const client = new BlobServiceClient(
	`https://${azure.accountName}.blob.core.windows.net`, //
	new StorageSharedKeyCredential(azure.accountName, azure.accountKey),
	{
		retryOptions: {
			maxTries: 5
		},
		keepAliveOptions: {
			enable: true
		}
	}
);

async function getAzureContainerClient(): Promise<ContainerClient> {
	const containerClient = client.getContainerClient(azure.containerName);

	const exists = await containerClient.exists();
	if (!exists) {
		throw new Error(`Blob container "${azure.containerName}" does not exist`);
	}

	return containerClient;
}

export const azureClient = await getAzureContainerClient();
