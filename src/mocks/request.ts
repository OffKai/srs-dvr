import type { DvrWebhookPayload } from '../lib/types/srs.js';

export const MockBody = (data: Partial<DvrWebhookPayload> & Pick<DvrWebhookPayload, 'app' | 'stream' | 'file'>): DvrWebhookPayload => ({
	action: '',
	client_id: '',
	ip: '',
	vhost: '',
	param: '',
	cwd: '',
	server_id: '',
	stream_url: '',
	stream_id: '',
	service_id: '',
	tcUrl: '',
	...data
});
