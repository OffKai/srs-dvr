import type { AzureConfig, S3Config } from '../config/schema.js';

export type UploadFunc = (
	uploadPath: string,
	filePath: string,
	options?: {
		onComplete?: () => void | Promise<void>;
		onFailure?: () => void | Promise<void>;
	}
) => Promise<void>;

export type StorageTypes = 'azure' | 's3';

export type StorageConfig<T extends StorageTypes> = T extends 'azure' //
	? AzureConfig
	: T extends 's3'
		? S3Config
		: never;

export type TrackerEntry = {
	app: string;
	stream: string;
	filename: string;
	path: string;
	storage: StorageTypes;
	date: string;
};
