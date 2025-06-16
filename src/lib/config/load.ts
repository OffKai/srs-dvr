import { isDev, isTesting } from '../utils/constants.js';
import { DvrConfigSchema, type DvrConfig } from './schema.js';
import { hydrateYaml, getYamlConfig } from './parser.js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import type { Unvalidated } from '../types/generic.js';

export async function loadConfig(): Promise<DvrConfig> {
	if (isTesting) {
		const testCfg = DvrConfigSchema.parse({
			dvr: {
				port: 3001
			},
			metrics: {
				enabled: true,
				port: 3002
			},
			storage: {
				autoCleanup: true,
				autoUpload: true,
				dataRoot: '/test_dir',
				defaultStorage: 'azure'
			},
			providers: {
				azure: {
					accountName: 'account',
					accountKey: 'key',
					containerName: 'test',
					accessTier: 'hot'
				},
				s3: {
					accessKey: 'access_key',
					secretKey: 'secret_key',
					bucket: 'bucket',
					endpoint: 'http://localhost',
					region: 'region',
					storageClass: 'STANDARD',
					minio: true
				}
			}
		} satisfies Unvalidated<DvrConfig>);

		return Object.freeze(testCfg);
	}

	// Load .env file if it exists
	if (isDev && existsSync(resolve('.env'))) {
		loadEnvFile();
	}

	const yamlRaw = await getYamlConfig();

	const cfg = DvrConfigSchema.safeParse(
		hydrateYaml(yamlRaw) //
	);

	if (cfg.error) {
		console.error('failed to load config');

		for (const err of cfg.error.issues) {
			console.error(`${err.path[0].toString()}: ${err.message}`);
		}

		process.exit(1);
	}

	return cfg.data;
}
