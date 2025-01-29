import { z } from 'zod';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

// Load .env file if it exists
if (existsSync(resolve('.env'))) {
	loadEnvFile();
}

const ConfigSchema = z.object({
	VERSION: z.string(),
	PORT: z.coerce.number(),
	AZURE_CONNECTION_STRING: z.undefined(),
	S3_ACCESS_KEY_ID: z.undefined(),
	S3_SECRET_ACCESS_KEY: z.undefined()
});

const obj = {
	VERSION: process.env.npm_package_version,
	PORT: process.env.PORT ?? 3001,
	AZURE_CONNECTION_STRING: undefined,
	S3_ACCESS_KEY_ID: undefined,
	S3_SECRET_ACCESS_KEY: undefined
} satisfies Record<keyof z.infer<typeof ConfigSchema>, unknown>;

export const config = ConfigSchema.parse(obj);
