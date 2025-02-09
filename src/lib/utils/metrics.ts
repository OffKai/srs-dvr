import promClient from 'prom-client';

export class DvrMetrics {
	public readonly contentType = promClient.register.contentType;

	public readonly upload = {
		attempt: new promClient.Counter({
			name: 'dvr_upload_attempts',
			help: 'The count of upload attempts',
			labelNames: ['storage']
		}),
		success: new promClient.Counter({
			name: 'dvr_upload_successes',
			help: 'The count of upload successes',
			labelNames: ['storage']
		}),
		failure: new promClient.Counter({
			name: 'dvr_upload_failures',
			help: 'The count of upload failures',
			labelNames: ['storage']
		})
	};

	public async collect(): Promise<string> {
		return promClient.register.metrics();
	}
}
