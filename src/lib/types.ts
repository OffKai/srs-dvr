import { z } from 'zod';

export const DvrWebhookPayloadSchema = z.object({
	server_id: z.string(),
	service_id: z.string(),
	action: z.string(),
	client_id: z.string(),
	ip: z.string(),
	vhost: z.string(),
	app: z.string(),
	tcUrl: z.string(),
	stream: z.string(),
	param: z.string(),
	cwd: z.string(),
	file: z.string(),
	stream_url: z.string(),
	stream_id: z.string()
});

export type DvrWebhookPayload = z.infer<typeof DvrWebhookPayloadSchema>;
