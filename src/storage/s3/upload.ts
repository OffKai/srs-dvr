import { createReadStream, ReadStream } from 'node:fs';
import { server } from '../../server.js';
import type { UploadFunc } from '../../lib/types/srs.js';
import { PutObjectCommand, type PutObjectCommandInput } from '@aws-sdk/client-s3';
import { s3Client } from './client.js';

const { s3 } = server.config.storage;

/**
 * Upload a file to S3-compatible storage
 * @param uploadPath - The path to upload the file to
 * @param filePath - The path to the file
 * @param options - Options for the upload
 */
export const s3Upload: UploadFunc = async (uploadPath, filePath, options) => {
	server.log.info(`uploading file: ${filePath}`);

	let stream: ReadStream | undefined;
	try {
		stream = createReadStream(filePath);

		const input: PutObjectCommandInput = {
			Bucket: s3.bucket,
			Key: uploadPath,
			Body: stream
		};

		if (s3.storageClass !== 'DEFAULT') {
			input.StorageClass = s3.storageClass;
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
