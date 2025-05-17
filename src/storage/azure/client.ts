import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { server } from '../../server.js';
import { isTesting } from '../../lib/utils/constants.js';

let cachedClient: ContainerClient | null = null;

export async function getAzureContainerClient(): Promise<ContainerClient> {
	if (cachedClient) {
		return cachedClient;
	}

	const azure = server.getProviderConfig('azure');

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

	if (isTesting) {
		throw new Error('azure client is not supported in testing mode');
	}

	const containerClient = client.getContainerClient(azure.containerName);

	const exists = await containerClient.exists();
	if (!exists) {
		throw new Error(`Blob container "${azure.containerName}" does not exist`);
	}

	cachedClient = containerClient;
	return containerClient;
}
