import { z } from 'zod';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { isTesting } from './constants.js';

// Load .env file if it exists
if (existsSync(resolve('.env'))) {
	loadEnvFile();
}

const ConfigSchema = z.object({
	VERSION: z.string(),
	PORT: z.coerce.number(),
	DVR_CONTAINER_NAME: z.string(),
	DVR_PATH_ROOT: z.string(),
	DVR_METRICS: z
		.enum(['true', 'false'])
		.transform((value) => value === 'true')
		.default('false'),
	DVR_AZURE_CONNECTION_STRING: z.string(),
	DVR_S3_ACCESS_KEY_ID: z.undefined(),
	DVR_S3_SECRET_ACCESS_KEY: z.undefined()
});

function loadConfig(): z.infer<typeof ConfigSchema> {
	const obj = {
		VERSION: process.env.npm_package_version,
		PORT: process.env.PORT ?? 3001,
		DVR_CONTAINER_NAME: isTesting //
			? 'test'
			: process.env.DVR_CONTAINER_NAME,
		DVR_PATH_ROOT: isTesting //
			? '/data'
			: process.env.DVR_PATH_ROOT,
		DVR_AZURE_CONNECTION_STRING: isTesting //
			? ''
			: process.env.DVR_AZURE_CONNECTION_STRING,
		DVR_METRICS: process.env.DVR_METRICS,
		DVR_S3_ACCESS_KEY_ID: undefined,
		DVR_S3_SECRET_ACCESS_KEY: undefined
	} satisfies Record<keyof z.infer<typeof ConfigSchema>, unknown>;

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

export const config = loadConfig();
