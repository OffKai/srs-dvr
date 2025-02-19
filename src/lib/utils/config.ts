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
	VERSION: z.string(),
	PORT: z.coerce.number().default(3001),
	METRICS_PORT: z.coerce.number().default(3002),
	DVR_METRICS_ENABLED: z
		.enum(['true', 'false'])
		.transform((value) => value === 'true')
		.default('true'),
	DVR_DATA_ROOT: z.string(),
	DVR_DEFAULT_STORAGE: z.enum<StorageTypes, [StorageTypes, ...StorageTypes[]]>(['azure']),
	DVR_AZURE_CONNECTION_STRING: z.string(),
	DVR_AZURE_CONTAINER_NAME: z.string()
});

export function loadConfig(): z.infer<typeof ConfigSchema> {
	let obj: Record<keyof z.infer<typeof ConfigSchema>, unknown> = {
		VERSION: process.env.npm_package_version,
		PORT: process.env.PORT,
		METRICS_PORT: process.env.METRICS_PORT,
		DVR_METRICS_ENABLED: process.env.DVR_METRICS_ENABLED,
		DVR_DATA_ROOT: process.env.DVR_DATA_ROOT,
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

	return cfg.data;
}
