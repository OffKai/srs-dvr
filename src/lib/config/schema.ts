import { z } from 'zod/v4';
import type { StorageTypes } from '../types/dvr.js';

const AzureSchema = z
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
		/** Access tier for uploaded files. `default` uses the default access tier set on the account. */
		accessTier: z //
			.enum(['default', 'hot', 'cool', 'cold', 'archive'])
			.default('default')
			.describe('Access tier for uploaded files. `default` uses the default access tier set on the account.')
	})
	.describe('Settings for Azure Blob Storage');

const S3Schema = z
	.object({
		accessKey: z.string(),
		secretKey: z.string(),
		bucket: z.string(),
		endpoint: z.string(),
		region: z.string(),
		storageClass: z //
			.enum([
				'DEFAULT',
				'STANDARD',
				'REDUCED_REDUNDANCY',
				'STANDARD_IA',
				'ONEZONE_IA',
				'INTELLIGENT_TIERING',
				'GLACIER',
				'DEEP_ARCHIVE',
				'OUTPOSTS',
				'GLACIER_IR',
				'SNOW',
				'EXPRESS_ONEZONE'
			])
			.default('DEFAULT'),
		minio: z.boolean().default(false)
	})
	.describe('Settings for S3-compatible storage');

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
				autoUpload: z //
					.boolean()
					.default(true)
					.describe('Enable automatic uploads on restart'),
				/** Root directory that recordings are stored in. */
				dataRoot: z //
					.string()
					.describe('Root directory that recordings are stored in'),
				/** Default storage provider to use. */
				defaultStorage: z //
					.enum(['azure', 's3'] satisfies StorageTypes[])
					.describe('Default storage provider to use')
			})
			.describe('Settings for storage'),
		providers: z.object({
			/** Settings for Azure Blob Storage */
			azure: AzureSchema.optional(),
			s3: S3Schema.optional()
		})
	})
	.describe('DVR configuration');

export type AzureConfig = z.infer<typeof AzureSchema>;
export type S3Config = z.infer<typeof S3Schema>;
export type DvrConfig = z.infer<typeof DvrConfigSchema>;
