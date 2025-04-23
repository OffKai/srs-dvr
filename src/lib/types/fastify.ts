import 'fastify';

import type { z } from 'zod';
import type { DvrMetrics } from '../utils/metrics.js';
import type { DvrConfigSchema } from '../config/schema.js';
import type { TrackerEntry } from './srs.js';

declare module 'fastify' {
	interface FastifyInstance {
		config: Readonly<z.infer<typeof DvrConfigSchema>>;
		metrics?: DvrMetrics;
		tracker: Map<string, TrackerEntry>;
	}
}
