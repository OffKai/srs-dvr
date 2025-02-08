import promClient from 'prom-client';

export class DvrMetrics {
	public readonly contentType = promClient.register.contentType;

	public readonly upload = {
		attempt: new promClient.Counter({
			name: 'dvr_upload_attempts',
			help: 'The count of upload attempts',
			labelNames: ['service']
		}),
		success: new promClient.Counter({
			name: 'dvr_upload_successes',
			help: 'The count of upload successes',
			labelNames: ['service']
		}),
		failure: new promClient.Counter({
			name: 'dvr_upload_failures',
			help: 'The count of upload failures',
			labelNames: ['service']
		})
	};

	public async collect(): Promise<string> {
		return promClient.register.metrics();
	}
}
