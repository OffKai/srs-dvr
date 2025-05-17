import { existsSync } from 'node:fs';
import yaml from 'yaml';
import { readFile } from 'node:fs/promises';
import { CONFIG_PATH } from '../utils/constants.js';

const SUBSTITUTE_REGEX = /^\$\{(\w+)(?::=)?([^}]+)?\}$/;

export async function getYamlConfig(path = CONFIG_PATH): Promise<Record<string, unknown>> {
	if (!existsSync(path)) {
		throw new Error(`Config file not found: ${path}`);
	}

	try {
		const file = await readFile(path, 'utf8');
		return yaml.parse(file, {
			version: '1.2'
		});
	} catch (err: unknown) {
		throw new Error(`Error reading config file`, { cause: err });
	}
}

export function hydrateYaml(obj: Record<string, unknown>): Record<string, unknown> {
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'string') {
			const match = SUBSTITUTE_REGEX.exec(value);
			if (match) {
				if (match[2]) {
					obj[key] = process.env[match[1]] || match[2];
				} else if (match) {
					obj[key] = process.env[match[1]];
				}
			}
		} else if (Array.isArray(value)) {
			obj[key] = value.map((item) => hydrateYaml(item));
		} else if (typeof value === 'object' && value !== null) {
			obj[key] = hydrateYaml(value as Record<string, unknown>);
		}
	}

	return obj;
}
