import { resolve } from 'node:path';
import { isDev } from './constants.js';

export function getFilePath(path: string): string {
	if (isDev) {
		// Resolves /data to ./data for local use
		return resolve(`.${path}`);
	}

	return path;
}

/**
 * Verify that the path uses the proper root
 */
export function verifyFilePath(path: string): boolean {
	if (isDev) {
		return true;
	}

	return path.startsWith('/data');
}
