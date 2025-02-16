import 'fastify';

import type { DvrMetrics } from '../utils/metrics.js';
import type { ConfigSchema } from '../utils/config.js';
import type { z } from 'zod';

declare module 'fastify' {
	interface FastifyInstance {
		config: z.infer<typeof ConfigSchema>;
		metrics?: DvrMetrics;
	}
}
