import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { isDev, RECORDINGS_PATH } from './constants.js';
import { server } from '../../server.js';

const { storage } = server.config;

const DATA_ROOT_REGEX = new RegExp(`^${storage.dataRoot}`);

export function resolveFilePath(path: string): string | null {
	if (isDev) {
		// Return relative path during development
		return resolve(`.${path}`);
	}

	if (path.startsWith(RECORDINGS_PATH)) {
		return path;
	}

	if (!path.startsWith(storage.dataRoot)) {
		return null;
	}

	return path.replace(DATA_ROOT_REGEX, RECORDINGS_PATH);
}

export function verifyFilePath(path: string): boolean {
	if (isDev) {
		return true;
	}

	if (!path.endsWith('.flv')) {
		return false;
	}

	return existsSync(path);
}

export function fmtUploadPath(data: { app: string; stream: string; filename: string }): string {
	return `${data.app}/${data.stream}/${data.filename}`;
}
