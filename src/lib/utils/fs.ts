import { resolve } from 'node:path';
import { isDev, isTesting } from './constants.js';
import { existsSync } from 'node:fs';
import { server } from '../../server.js';

export function getFilePath(path: string): string {
	if (isDev && !isTesting) {
		// Resolves /data to ./data for local use
		return resolve(`.${path}`);
	}

	return path;
}

export function fmtUploadPath(data: { app: string; stream: string; filename: string }): string {
	return `${data.app}/${data.stream}/${data.filename}`;
}

export function verifyFilePath(path: string): boolean {
	if (isDev && !isTesting) {
		return true;
	}

	if (!path.startsWith(server.config.storage.dataRoot)) {
		return false;
	}

	if (!path.endsWith('.flv')) {
		return false;
	}

	return existsSync(path);
}
