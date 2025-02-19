import 'fastify';

import type { z } from 'zod';
import type { DvrMetrics } from '../utils/metrics.js';
import type { ConfigSchema } from '../utils/config.js';
import type { TrackerVideo } from './srs.js';

declare module 'fastify' {
	interface FastifyInstance {
		config: z.infer<typeof ConfigSchema>;
		metrics?: DvrMetrics;
		tracker: Map<string, TrackerVideo>;
	}
}
