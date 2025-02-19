import type { DvrWebhookPayload } from '../types/srs.js';

export const isDev = process.env.NODE_ENV !== 'production';
export const isTesting = process.env.TESTING === 'true';

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
		stream_id: { type: 'string' }
	} satisfies Record<keyof DvrWebhookPayload, unknown>
};
