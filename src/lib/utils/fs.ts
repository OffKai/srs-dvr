import { resolve } from 'node:path';
import { isDev, isTesting } from './constants.js';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { server } from '../../server.js';
import type { TrackerVideo } from '../types/srs.js';

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

	if (!path.startsWith(server.config.DVR_DATA_ROOT)) {
		return false;
	}

	if (!path.endsWith('.flv')) {
		return false;
	}

	return existsSync(path);
}

type JsonData = { videos: Array<TrackerVideo> };

export const tracker = {
	path: resolve('videos.json'),
	init: async function (): Promise<void> {
		if (!existsSync(this.path)) {
			await writeFile(this.path, JSON.stringify({ videos: [] } satisfies JsonData));
		}
	},
	add: async function (video: TrackerVideo, options?: { checkExisting: boolean }): Promise<void> {
		const videos = await tracker.read();

		if (options?.checkExisting && videos.some((v) => v.path === video.path)) {
			return;
		}

		videos.push(video);

		await writeFile(this.path, JSON.stringify({ videos } satisfies JsonData), 'utf-8');
	},
	read: async function (): Promise<Array<TrackerVideo>> {
		const file = await readFile(this.path, 'utf-8');
		const json: JsonData = JSON.parse(file);

		return json.videos;
	},
	remove: async function (path: string): Promise<void> {
		const videos = await tracker.read();

		await writeFile(
			this.path,
			JSON.stringify({
				videos: videos.filter((video) => video.path !== path)
			} satisfies JsonData),
			'utf-8'
		);
	},
	has: async function (path: string): Promise<boolean> {
		const videos = await tracker.read();

		return videos.some((video) => video.path === path);
	}
};
