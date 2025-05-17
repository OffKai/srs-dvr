import 'fastify';

import type { DvrMetrics } from '../utils/metrics.js';
import type { DvrConfig } from '../config/schema.js';
import type { preHandlerAsyncHookHandler, RouteGenericInterface } from 'fastify';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { server } from '../../server.js';
import type { StorageConfig, StorageTypes, TrackerEntry } from './dvr.js';

declare module 'fastify' {
	interface FastifyInstance {
		config: Omit<DvrConfig, 'providers'>;
		getProviderConfig: <P extends StorageTypes>(provider: P) => StorageConfig<P>;
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
