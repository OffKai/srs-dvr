import { isDev, isTesting } from '../utils/constants.js';
import { DvrConfigSchema, type DvrConfig } from './schema.js';
import { hydrateYaml, getYamlConfig } from './parser.js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import type { Unvalidated } from '../types/generic.js';
import { server } from '../../server.js';

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
				dataRoot: '/data',
				defaultStorage: 'azure',
				azure: {
					accountName: 'account',
					accountKey: 'key',
					containerName: 'test',
					accessTier: 'hot'
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
		console.error('Failed to load config');

		for (const err of cfg.error.errors) {
			console.error(`${err.path[0]}: ${err.message}`);
		}

		process.exit(1);
	}

	return cfg.data;
}

export function reloadConfig(): void {
	server.log.warn('not implemented');
}
