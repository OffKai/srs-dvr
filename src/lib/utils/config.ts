import { z } from 'zod';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { isTesting } from './constants.js';
import type { StorageTypes } from '../types/srs.js';

// Load .env file if it exists
if (existsSync(resolve('.env'))) {
	loadEnvFile();
}

export const ConfigSchema = z.object({
	/** The version of the app. */
	VERSION: z.string(),
	/** The port the server will listen on. */
	PORT: z.coerce.number().default(3001),
	/** The port the metrics server will listen on. */
	METRICS_PORT: z.coerce.number().default(3002),
	/** Whether or not to enable metrics. */
	DVR_METRICS_ENABLED: z
		.enum(['true', 'false'])
		.transform((value) => value === 'true')
		.default('false'),
	/** The root directory that recordings are stored in. */
	DVR_DATA_ROOT: z.string(),
	/** If recordings should be deleted after being uploaded. */
	DVR_DISABLE_CLEANUP: z
		.enum(['true', 'false'])
		.transform((value) => value === 'true')
		.default('false'),
	/** The default storage type to use. */
	DVR_DEFAULT_STORAGE: z.enum<StorageTypes, [StorageTypes, ...StorageTypes[]]>(['azure']),
	/** The connection string for Azure Blob Storage. */
	DVR_AZURE_CONNECTION_STRING: z.string(),
	/** The container name for Azure Blob Storage. */
	DVR_AZURE_CONTAINER_NAME: z.string()
});

export function loadConfig(): Readonly<z.infer<typeof ConfigSchema>> {
	let obj: Record<keyof z.infer<typeof ConfigSchema>, unknown> = {
		VERSION: process.env.npm_package_version,
		PORT: process.env.PORT,
		METRICS_PORT: process.env.METRICS_PORT,
		DVR_METRICS_ENABLED: process.env.DVR_METRICS_ENABLED,
		DVR_DATA_ROOT: process.env.DVR_DATA_ROOT,
		DVR_DISABLE_CLEANUP: process.env.DVR_DISABLE_DELETE,
		DVR_DEFAULT_STORAGE: process.env.DVR_DEFAULT_STORAGE,
		DVR_AZURE_CONNECTION_STRING: process.env.DVR_AZURE_CONNECTION_STRING,
		DVR_AZURE_CONTAINER_NAME: process.env.DVR_AZURE_CONTAINER_NAME
	};

	if (isTesting) {
		obj = {
			VERSION: process.env.npm_package_version,
			PORT: 3001,
			METRICS_PORT: 3002,
			DVR_METRICS_ENABLED: 'true',
			DVR_DATA_ROOT: '/data',
			DVR_DISABLE_CLEANUP: 'false',
			DVR_DEFAULT_STORAGE: 'azure',
			DVR_AZURE_CONNECTION_STRING: '',
			DVR_AZURE_CONTAINER_NAME: 'test'
		};
	}

	const cfg = ConfigSchema.safeParse(obj);

	if (cfg.error) {
		console.error('Failed to load environment variables');

		for (const err of cfg.error.errors) {
			console.error(`${err.path[0]}: ${err.message}`);
		}

		process.exit(1);
	}

	return Object.freeze(cfg.data);
}
