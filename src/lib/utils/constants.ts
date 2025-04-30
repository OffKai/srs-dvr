import { resolve } from 'node:path';
import type { DvrWebhookPayload } from '../types/srs.js';

export const isDev = process.env.NODE_ENV !== 'production';
export const isTesting = process.env.TESTING === 'true';

export const APP_VERSION = process.env.npm_package_version;

const CONFIG_NAME = 'dvr.config.yaml';

const APP_DIR = '/etc/dvr';
export const CONFIG_PATH = isDev ? resolve(CONFIG_NAME) : `${APP_DIR}/${CONFIG_NAME}`;
export const RECORDINGS_PATH = '/recordings';

export const DvrWebhookSchema = {
	$id: 'DvrWebhookPayload',
	type: 'object',
	additionalProperties: false,
	required: [
		'app', //
		'stream',
		'file'
	],
	properties: {
		server_id: { type: 'string' },
		service_id: { type: 'string' },
		action: { type: 'string' },
		client_id: { type: 'string' },
		ip: { type: 'string' },
		vhost: { type: 'string' },
		app: { type: 'string' },
		tcUrl: { type: 'string' },
		stream: { type: 'string' },
		param: { type: 'string' },
		cwd: { type: 'string' },
		file: { type: 'string' },
		stream_url: { type: 'string' },
		stream_id: { type: 'string' },
		dvr: { type: 'string' }
	} satisfies Record<keyof DvrWebhookPayload, unknown>
};
