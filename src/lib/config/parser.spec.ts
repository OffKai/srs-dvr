import type { Unvalidated } from '../types/generic.js';
import { hydrateYaml } from './parser.js';
import type { DvrConfig } from './schema.js';

describe('parser', () => {
	describe('hydrateYaml', () => {
		it('should hydrate config', () => {
			vi.stubEnv('DVR_METRICS_PORT', '3002');
			vi.stubEnv('DVR_STORAGE_AUTO_CLEANUP', 'true');
			vi.stubEnv('DVR_STORAGE_DATA_ROOT', '/tmp/dvr');
			vi.stubEnv('DVR_STORAGE_DEFAULT', 'azure');
			vi.stubEnv('DVR_AZURE_ACCOUNT_NAME', 'account_name');
			vi.stubEnv('DVR_AZURE_ACCOUNT_KEY', 'account_key');
			vi.stubEnv('DVR_AZURE_CONTAINER_NAME', 'container');
			vi.stubEnv('DVR_S3_ACCESS_KEY', 'access_key');
			vi.stubEnv('DVR_S3_SECRET_KEY', 'secret_key');
			vi.stubEnv('DVR_S3_BUCKET', 'bucket');
			vi.stubEnv('DVR_S3_ENDPOINT', 'endpoint');
			vi.stubEnv('DVR_S3_REGION', 'us-east-1');

			const result = hydrateYaml({
				dvr: {
					port: 3001
				},
				metrics: {
					port: '${DVR_METRICS_PORT}',
					enabled: true
				},
				storage: {
					autoCleanup: '${DVR_STORAGE_AUTO_CLEANUP}',
					dataRoot: '${DVR_STORAGE_DATA_ROOT}',
					defaultStorage: '${DVR_STORAGE_DEFAULT}'
				},
				providers: {
					azure: {
						accountName: '${DVR_AZURE_ACCOUNT_NAME}',
						accountKey: '${DVR_AZURE_ACCOUNT_KEY}',
						containerName: '${DVR_AZURE_CONTAINER_NAME}',
						accessTier: 'default'
					},
					s3: {
						accessKey: '${DVR_S3_ACCESS_KEY}',
						secretKey: '${DVR_S3_SECRET_KEY}',
						bucket: '${DVR_S3_BUCKET}',
						endpoint: '${DVR_S3_ENDPOINT}',
						region: '${DVR_S3_REGION}',
						storageClass: 'STANDARD',
						minio: true
					}
				}
			} satisfies Unvalidated<DvrConfig>);

			expect(result).toEqual({
				dvr: {
					port: 3001
				},
				metrics: {
					port: '3002',
					enabled: true
				},
				storage: {
					autoCleanup: 'true',
					dataRoot: '/tmp/dvr',
					defaultStorage: 'azure'
				},
				providers: {
					azure: {
						accountName: 'account_name',
						accountKey: 'account_key',
						containerName: 'container',
						accessTier: 'default'
					},
					s3: {
						accessKey: 'access_key',
						secretKey: 'secret_key',
						bucket: 'bucket',
						endpoint: 'endpoint',
						region: 'us-east-1',
						storageClass: 'STANDARD',
						minio: true
					}
				}
			});
		});
	});
});
