import 'fastify';

import type { z } from 'zod';
import type { DvrMetrics } from '../utils/metrics.js';
import type { DvrConfigSchema } from '../config/schema.js';
import type { TrackerEntry } from './srs.js';
import type { preHandlerAsyncHookHandler, RouteGenericInterface } from 'fastify';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { server } from '../../server.js';

declare module 'fastify' {
	interface FastifyInstance {
		config: Readonly<z.infer<typeof DvrConfigSchema>>;
		metrics?: DvrMetrics;
		tracker: Map<string, TrackerEntry>;
	}
}

declare module '@fastify/request-context' {
	interface RequestContextData {
		path: string;
	}
}

export type GenericPreHandler<RouteGeneric extends RouteGenericInterface = RouteGenericInterface> = preHandlerAsyncHookHandler<
	typeof server.server,
	IncomingMessage,
	ServerResponse,
	RouteGeneric
>;
