import type { DvrWebhookPayload } from '../lib/types/srs.js';

export const MockBody = (data: Partial<DvrWebhookPayload>): DvrWebhookPayload => ({
	action: '',
	client_id: '',
	ip: '',
	vhost: '',
	app: '',
	stream: '',
	param: '',
	cwd: '',
	file: '',
	server_id: '',
	stream_url: '',
	stream_id: '',
	service_id: '',
	tcUrl: '',
	...data
});
