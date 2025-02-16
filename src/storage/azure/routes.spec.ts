import { ReadStream } from 'node:fs';
import { MockBody } from '../../mocks/request.js';
import { server } from '../../server.js';
import { azureRoutes } from './routes.js';
import type { BlobServiceClient, BlockBlobClient, ContainerClient } from '@azure/storage-blob';

const mocks = vi.hoisted(() => {
	const uploadStream = vi.fn();

	class MockBlobServiceClient implements Partial<BlobServiceClient> {
		// @ts-expect-error - Partial client
		public getContainerClient = vi.fn<() => Partial<ContainerClient>>(() => {
			return {
				getBlockBlobClient: vi.fn<() => Partial<BlockBlobClient>>(() => ({
					uploadStream
				})),
				exists: vi.fn(() => Promise.resolve(true))
			};
		});

		public static fromConnectionString = vi.fn(() => new MockBlobServiceClient());
	}

	return {
		uploadStream,
		MockBlobServiceClient,
		rm: vi.fn(),
		existsSync: vi.fn(() => true),
		tracker: {
			add: vi.fn(),
			remove: vi.fn(),
			has: vi.fn()
		}
	};
});

vi.mock('node:timers', () => ({
	setTimeout: vi.fn((fn) => fn()),
	setImmediate: vi.fn((fn) => fn())
}));
vi.mock('node:process', () => ({ loadEnvFile: vi.fn() }));
vi.mock('node:fs', async (og) => {
	const fs = await og<typeof import('node:fs')>();
	return {
		ReadStream: fs.ReadStream,
		createReadStream: vi.fn(() => ReadStream.from([])),
		existsSync: mocks.existsSync
	};
});
vi.mock('node:fs/promises', () => ({ rm: mocks.rm }));
vi.mock('@azure/storage-blob', () => ({
	BlobServiceClient: mocks.MockBlobServiceClient
}));
vi.mock('../../lib/utils/fs.js', async (imp) => {
	const fs = await imp<typeof import('../../lib/utils/fs.js')>();
	return { ...fs, tracker: mocks.tracker };
});

describe('Azure routes', () => {
	beforeAll(async () => {
		await server.register(azureRoutes);
	});

	describe('logic', () => {
		const file = '/data/app_id/stream_id/video.flv';
		const body = MockBody({ file });

		it('should upload file', async () => {
			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });

			expect(mocks.uploadStream).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledWith(file);
		});

		test('uploadStream throws error once', async () => {
			mocks.uploadStream.mockRejectedValueOnce(new Error());

			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });

			expect(mocks.uploadStream).toHaveBeenCalledTimes(2);
			expect(mocks.rm).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledWith(file);
		});

		test('rm throws error', async () => {
			mocks.rm.mockRejectedValue(new Error());

			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });

			expect(mocks.uploadStream).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledWith(file);
			await expect(mocks.rm).rejects.toThrow();
		});

		test('bail with max retries', async () => {
			mocks.uploadStream.mockRejectedValue(new Error());

			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });

			expect(mocks.uploadStream).toHaveBeenCalledTimes(5);
			expect(mocks.rm).not.toHaveBeenCalled();
		});

		it('should fail if file is already being uploaded', async () => {
			mocks.tracker.has //
				.mockResolvedValueOnce(false)
				.mockResolvedValueOnce(true);

			const resOne = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			const resTwo = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			expect(resOne.statusCode).toBe(200);
			expect(resOne.json()).toStrictEqual({ code: 0 });

			expect(resTwo.statusCode).toBe(400);
			expect(resTwo.json()).toStrictEqual({ code: 1 });
		});
	});

	describe('validation', () => {
		it('should fail with invalid body', async () => {
			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body: {
					key: 'value'
				}
			});

			expect(response.statusCode).toBe(400);
			expect(response.json()).toStrictEqual({ code: 1 });
		});

		it('should fail with invalid path root', async () => {
			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body: MockBody({ file: '/invalid/video.flv' })
			});

			expect(response.statusCode).toBe(400);
			expect(response.json()).toStrictEqual({ code: 1 });
		});

		it('should fail with invalid file extension', async () => {
			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body: MockBody({ file: '/data/video.txt' })
			});

			expect(response.statusCode).toBe(400);
			expect(response.json()).toStrictEqual({ code: 1 });
		});

		it("should fail if file doesn't exist", async () => {
			mocks.existsSync.mockReturnValueOnce(false);

			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body: MockBody({ file: '/data/video.flv' })
			});

			expect(response.statusCode).toBe(400);
			expect(response.json()).toStrictEqual({ code: 1 });

			expect(mocks.existsSync).toHaveBeenCalledTimes(1);
		});
	});
});
