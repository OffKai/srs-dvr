import { register, Counter } from 'prom-client';
import { type FastifyInstance, fastify } from 'fastify';
import { server } from '../../server.js';

export class DvrMetrics {
	readonly #server: FastifyInstance;

	public readonly upload = {
		attempt: new Counter({
			name: 'dvr_upload_attempts',
			help: 'The count of upload attempts',
			labelNames: ['storage']
		}),
		success: new Counter({
			name: 'dvr_upload_successes',
			help: 'The count of upload successes',
			labelNames: ['storage']
		}),
		failure: new Counter({
			name: 'dvr_upload_failures',
			help: 'The count of upload failures',
			labelNames: ['storage']
		})
	};

	public constructor() {
		this.#server = fastify({
			disableRequestLogging: true,
			logger: {
				level: 'silent'
			}
		});

		this.#server.get('/metrics', async (_, res) => {
			if (!server.config.DVR_METRICS_ENABLED) {
				await res.status(501).send({ message: 'Metrics are not enabled' });
				return;
			}

			const metrics = await this.collect();
			await res
				.status(200) //
				.header('content-type', register.contentType)
				.send(metrics);
		});

		this.#server.get('/status', async (_, res) => {
			const videos = server.tracker.values().toArray();

			const payload: string[] = videos
				.sort((a, b) => b.date.localeCompare(a.date))
				.map((video) => `${video.date}  ${video.storage.padEnd(8, ' ')}  ${video.path}`);

			payload.unshift('date                      storage   file');

			await res //
				.status(200)
				.header('content-type', 'text/plain')
				.send(payload.join('\n'));
		});
	}

	public async collect(): Promise<string> {
		return await register.metrics();
	}

	public async listen(options: { host: string; port: number }): Promise<void> {
		await this.#server.listen({
			host: options.host,
			port: options.port
		});
	}

	public async shutdown(): Promise<void> {
		register.clear();
		await this.#server.close();
	}
}
