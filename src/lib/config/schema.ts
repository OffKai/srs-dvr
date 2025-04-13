import { z } from 'zod';
import type { StorageTypes } from '../types/srs.js';

export const DvrConfigSchema = z
	.object({
		/** General settings */
		dvr: z
			.object({
				/**
				 * Port the HTTP server should listen on.
				 * @default 3001
				 */
				port: z.coerce //
					.number()
					.default(3001)
					.describe('Port the HTTP server should listen on')
			})
			.describe('General settings'),
		/** Settings for metrics */
		metrics: z
			.object({
				/**
				 * Enable or disable metrics collection.
				 * @default false
				 */
				enabled: z //
					.boolean()
					.default(false)
					.describe('Enable or disable metrics collection'),
				/**
				 * Port the metrics server should listen on.
				 * @default 3002
				 */
				port: z.coerce //
					.number()
					.default(3002)
					.describe('Port the metrics server should listen on')
			})
			.describe('Settings for metrics'),
		/** Settings for storage */
		storage: z
			.object({
				/**
				 * Enable automatic cleanup of uploaded files.
				 * @default true
				 */
				autoCleanup: z //
					.boolean()
					.default(true)
					.describe('Enable automatic cleanup of uploaded files'),
				/** Root directory that recordings are stored in. */
				dataRoot: z //
					.string()
					.describe('Root directory that recordings are stored in'),
				/** Default storage provider to use. */
				defaultStorage: z //
					.enum<StorageTypes, [StorageTypes, ...StorageTypes[]]>(['azure'])
					.describe('Default storage provider to use'),
				/** Settings for Azure Blob Storage */
				azure: z
					.object({
						/** Azure Blob Storage account name. */
						accountName: z //
							.string()
							.describe('Azure Blob Storage account name'),
						/** Azure Blob Storage account key. */
						accountKey: z //
							.string()
							.describe('Azure Blob Storage account key'),
						/** Azure Blob Storage container to upload to. */
						containerName: z //
							.string()
							.describe('Azure Blob Storage container to upload to'),
						/** Access tier for uploaded files. `default` uses the access tier set on the account. */
						accessTier: z //
							.enum(['default', 'hot', 'cool', 'cold', 'archive'])
							.default('default')
							.describe('Access tier for uploaded files. `default` uses the access tier set on the account.')
					})
					.describe('Settings for Azure Blob Storage')
			})
			.describe('Settings for storage')
	})
	.describe('DVR configuration');

export type DvrConfig = z.infer<typeof DvrConfigSchema>;
