import type { Unvalidated } from '../types/generic.js';
import { hydrateYaml, readEnvVar } from './parser.js';
import type { DvrConfig } from './schema.js';

describe('parser', () => {
	describe('readEnvVar', () => {
		it('should substitute string', () => {
			vi.stubEnv('TEST_ENV_VAR', 'test_value');

			const result = readEnvVar('TEST_ENV_VAR');
			expect(result).toBe('test_value');
		});

		it('should substitute number', () => {
			vi.stubEnv('TEST_ENV_VAR', '5');

			const result = readEnvVar('TEST_ENV_VAR');
			expect(result).toBe(5);
		});

		it('should substitute true', () => {
			vi.stubEnv('TEST_ENV_VAR', 'true');

			const result = readEnvVar('TEST_ENV_VAR');
			expect(result).toBe(true);
		});

		it('should substitute false', () => {
			vi.stubEnv('TEST_ENV_VAR', 'false');

			const result = readEnvVar('TEST_ENV_VAR');
			expect(result).toBe(false);
		});

		it('should throw with invalid key', () => {
			expect(() => {
				readEnvVar('INVALID_KEY');
			}).toThrow('Environment variable "INVALID_KEY" is not defined');
		});
	});

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
					defaultStorage: '${DVR_STORAGE_DEFAULT}',
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
					port: 3002,
					enabled: true
				},
				storage: {
					autoCleanup: true,
					dataRoot: '/tmp/dvr',
					defaultStorage: 'azure',
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
			} satisfies DvrConfig);
		});
	});
});
