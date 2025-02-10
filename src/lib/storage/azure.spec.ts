import { server } from '../../server.js';
import { azureRoutes } from './azure.routes.js';
import type { DvrWebhookPayload } from '../types/srs.js';
import type { BlockBlobClient } from '@azure/storage-blob';

function flushPromises() {
	// https://github.com/jestjs/jest/issues/2157#issuecomment-279171856
	return new Promise((r) => setImmediate(r));
}

const mocks = vi.hoisted(() => {
	return {
		createReadStream: vi.fn(),
		rm: vi.fn(),
		setTimeout: vi.fn().mockImplementation((fn) => fn()),
		uploadStream: vi.fn()
	};
});

vi.mock('node:fs', () => ({
	createReadStream: mocks.createReadStream,
	existsSync: vi.fn().mockReturnValue(false)
}));
vi.mock('node:fs/promises', () => ({ rm: mocks.rm }));
vi.mock('node:timers', () => ({ setTimeout: mocks.setTimeout }));
vi.mock('@azure/storage-blob', () => {
	class MockBlobServiceClient {
		public getContainerClient = vi.fn().mockReturnValue({
			getBlockBlobClient: vi.fn<() => Partial<BlockBlobClient>>().mockReturnValue({
				uploadStream: mocks.uploadStream
			})
		});

		public static fromConnectionString = vi.fn().mockReturnValue(new MockBlobServiceClient());
	}

	return {
		BlobServiceClient: MockBlobServiceClient
	};
});

describe('Azure route testing', () => {
	beforeAll(async () => {
		await server.register(azureRoutes);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('logic', () => {
		const path = '/data/test.txt';

		const body: DvrWebhookPayload = {
			action: '',
			client_id: '',
			ip: '',
			vhost: '',
			app: '',
			stream: '',
			param: '',
			cwd: '',
			file: path,
			server_id: '',
			stream_url: '',
			stream_id: '',
			service_id: '',
			tcUrl: ''
		};

		it('should upload file', async () => {
			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			await flushPromises();

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });
			expect(mocks.createReadStream).toHaveBeenCalledTimes(1);
			expect(mocks.createReadStream).toHaveBeenCalledWith(path);
			expect(mocks.uploadStream).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledWith(path);
		});

		test('uploadStream throws error once', async () => {
			mocks.uploadStream.mockRejectedValueOnce(new Error());

			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			await flushPromises();

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });
			expect(mocks.createReadStream).toHaveBeenCalledTimes(2);
			expect(mocks.createReadStream).toHaveBeenCalledWith(path);
			expect(mocks.uploadStream).toHaveBeenCalledTimes(2);
			expect(mocks.rm).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledWith(path);
		});

		test('rm throws error', async () => {
			mocks.rm.mockRejectedValue(new Error());

			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			await flushPromises();

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });
			expect(mocks.createReadStream).toHaveBeenCalledTimes(1);
			expect(mocks.createReadStream).toHaveBeenCalledWith(path);
			expect(mocks.uploadStream).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledWith(path);
			await expect(mocks.rm).rejects.toThrow();
		});

		test('bail with max retries', async () => {
			mocks.uploadStream.mockRejectedValue(new Error());

			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			await flushPromises();

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });
			expect(mocks.createReadStream).toHaveBeenCalledTimes(5);
			expect(mocks.createReadStream).toHaveBeenCalledWith(path);
			expect(mocks.uploadStream).toHaveBeenCalledTimes(5);
			expect(mocks.rm).not.toHaveBeenCalled();
		});
	});

	describe('validation', () => {
		it('should fail with invalid body', async () => {
			const testBody = {
				key: 'value'
			};

			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body: testBody
			});

			expect(response.statusCode).toBe(400);
			expect(response.json()).toStrictEqual({ code: 1 });
		});

		it('should fail with invalid file path', async () => {
			const testBody: DvrWebhookPayload = {
				action: '',
				client_id: '',
				ip: '',
				vhost: '',
				app: '',
				stream: '',
				param: '',
				cwd: '',
				file: '/invalid/test.txt',
				server_id: '',
				stream_url: '',
				stream_id: '',
				service_id: '',
				tcUrl: ''
			};

			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body: testBody
			});

			expect(response.statusCode).toBe(400);
			expect(response.json()).toStrictEqual({ code: 1 });
		});
	});
});
