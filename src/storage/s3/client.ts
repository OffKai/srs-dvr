import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { server } from '../../server.js';
import { isTesting } from '../../lib/utils/constants.js';

const { s3 } = server.config.storage;

const client = new S3Client({
	endpoint: s3.endpoint,
	region: s3.region,
	forcePathStyle: s3.minio, // MinIO compatibility
	credentials: {
		accessKeyId: s3.accessKey,
		secretAccessKey: s3.secretKey
	}
});

export async function getS3Client(): Promise<S3Client> {
	if (isTesting) {
		throw new Error('s3 client is not supported in testing mode');
	}

	try {
		await client.send(
			new HeadBucketCommand({
				Bucket: s3.bucket
			})
		);
	} catch (err: unknown) {
		if (err instanceof Error) {
			if ('$metadata' in err && typeof err.$metadata === 'object' && err.$metadata) {
				if ('httpStatusCode' in err.$metadata && err.$metadata.httpStatusCode === 403) {
					throw new Error(`403 - Unauthenticated`);
				}

				if ('httpStatusCode' in err.$metadata && err.$metadata.httpStatusCode === 404) {
					throw new Error(`404 - Bucket "${s3.bucket}" does not exist`);
				}
			}
		}

		throw err;
	}

	return client;
}
export const s3Client = await getS3Client();
