import promClient from 'prom-client';
import Fastify, { type FastifyInstance } from 'fastify';
import { config } from './config.js';

export class DvrMetrics {
	readonly #server: FastifyInstance;

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

	public constructor() {
		this.#server = Fastify({
			logger: {
				level: 'silent'
			}
		});

		this.#server.get('/metrics', async (_, res) => {
			if (!config.DVR_METRICS_ENABLED) {
				await res.status(501).send({ message: 'Metrics are not enabled' });
				return;
			}

			const metrics = await this.collect();
			await res
				.status(200) //
				.header('content-type', promClient.register.contentType)
				.send(metrics);
		});
	}

	public async collect(): Promise<string> {
		return promClient.register.metrics();
	}

	public async listen(options: { host: string; port: number }): Promise<void> {
		await this.#server.listen({
			host: options.host,
			port: options.port
		});
	}

	public async shutdown(): Promise<void> {
		promClient.register.clear();
		await this.#server.close();
	}
}
