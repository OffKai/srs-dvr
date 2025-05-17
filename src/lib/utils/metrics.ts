import { register, Counter, Gauge } from 'prom-client';
import { type FastifyInstance, fastify } from 'fastify';
import { server } from '../../server.js';

export class DvrMetrics {
	readonly #server: FastifyInstance;

	public readonly upload = upload;

	public constructor() {
		this.#server = fastify({
			disableRequestLogging: true,
			logger: {
				level: 'silent'
			}
		});

		this.#server.get('/metrics', async (_, res) => {
			if (!server.config.metrics.enabled) {
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
			const recordings = server.tracker.values().toArray();

			const payload: string[] = recordings
				.sort((a, b) => b.date.localeCompare(a.date))
				.map((recording) => `${recording.date}  ${recording.storage.padEnd(8, ' ')}  ${recording.path}`);

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

const upload = {
	attempt: new Counter({
		name: 'dvr_upload_attempt_count',
		help: 'Count of upload attempts',
		labelNames: ['storage']
	}),
	success: new Counter({
		name: 'dvr_upload_success_count',
		help: 'Count of upload successes',
		labelNames: ['storage']
	}),
	failure: new Counter({
		name: 'dvr_upload_failure_count',
		help: 'Count of upload failures',
		labelNames: ['storage']
	}),
	inprogress: new Gauge({
		name: 'dvr_upload_inprogress_total',
		help: 'Gauge of uploads in progress',
		collect() {
			if (!server.ready) return;
			this.set(server.tracker.size);
		}
	})
};
