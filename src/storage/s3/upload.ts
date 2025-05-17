import { createReadStream, ReadStream } from 'node:fs';
import { server } from '../../server.js';
import type { UploadFunc } from '../../lib/types/dvr.js';
import { PutObjectCommand, type PutObjectCommandInput } from '@aws-sdk/client-s3';
import { getS3Client } from './client.js';

/**
 * Upload a file to S3-compatible storage
 * @param uploadPath - The path to upload the file to
 * @param filePath - The path to the file
 * @param options - Options for the upload
 */
export const s3Upload: UploadFunc = async (uploadPath, filePath, options) => {
	const s3Config = server.getProviderConfig('s3');
	const s3Client = await getS3Client();

	server.log.info(`uploading file: ${filePath}`);

	let stream: ReadStream | undefined;
	try {
		stream = createReadStream(filePath);

		const input: PutObjectCommandInput = {
			Bucket: s3Config.bucket,
			Key: uploadPath,
			Body: stream
		};

		if (s3Config.storageClass !== 'DEFAULT') {
			input.StorageClass = s3Config.storageClass;
		}

		const command = new PutObjectCommand(input);
		await s3Client.send(command);
	} catch (err: unknown) {
		stream?.destroy();

		server.log.error(err, `failed to upload file: ${filePath}`);

		if (options?.onFailure) {
			await options.onFailure();
		}

		return;
	}

	server.log.info(`file uploaded: ${filePath}`);

	if (options?.onComplete) {
		await options.onComplete();
	}
};
