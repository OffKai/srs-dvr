import { resolve } from 'node:path';
import { isDev } from './constants.js';

export function getFilePath(path: string): string {
	if (isDev) {
		return resolve(`.${path}`);
	}

	return path;
}

export function verifyFilePath(path: string): boolean {
	return path.startsWith('/data');
}
