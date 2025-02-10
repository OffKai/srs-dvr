import { resolve } from 'node:path';
import { isDev, isTesting } from './constants.js';
import { config } from './config.js';

export function getFilePath(path: string): string {
	if (isDev && !isTesting) {
		// Resolves /data to ./data for local use
		return resolve(`.${path}`);
	}

	return path;
}

/**
 * Verify that the path uses the proper root
 */
export function verifyFilePath(path: string): boolean {
	return path.startsWith(config.DVR_PATH_ROOT);
}
