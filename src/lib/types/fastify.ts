import 'fastify';

import type { DvrMetrics } from '../utils/metrics.js';

declare module 'fastify' {
	interface FastifyInstance {
		metrics?: DvrMetrics;
	}
}
