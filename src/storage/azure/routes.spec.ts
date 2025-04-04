import { ReadStream } from 'node:fs';
import { MockBody } from '../../mocks/request.js';
import { server } from '../../server.js';
import { azureRoutes } from './routes.js';
import type { BlockBlobClient, ContainerClient } from '@azure/storage-blob';

async function flushPromises() {
	// ref: https://github.com/jestjs/jest/issues/2157#issuecomment-279171856
	await new Promise((resolve) => setImmediate(resolve));
}

const mocks = vi.hoisted(() => {
	return {
		uploadStream: vi.fn(),
		rm: vi.fn(),
		existsSync: vi.fn(() => true)
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
vi.mock('./client.js', () => ({
	// @ts-expect-error - Partial client
	getAzureContainerClient: vi.fn<() => Partial<ContainerClient>>(() => {
		return {
			getBlockBlobClient: vi.fn<() => Partial<BlockBlobClient>>(() => ({
				uploadStream: mocks.uploadStream
			}))
		};
	})
}));

describe('Azure routes', () => {
	beforeAll(async () => {
		await server.register(azureRoutes);
	});

	beforeEach(() => {
		server.tracker.clear();
	});

	describe('logic', () => {
		const body = MockBody({
			app: 'app_id',
			stream: 'stream_id',
			file: '/data/app_id/stream_id/video.flv'
		});

		it('should upload file', async () => {
			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			await flushPromises();

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });

			expect(mocks.uploadStream).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledWith(body.file);
		});

		test('uploadStream throws error', async () => {
			mocks.uploadStream.mockRejectedValueOnce(new Error());

			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			await flushPromises();

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });

			expect(mocks.uploadStream).toHaveBeenCalledTimes(1);
			expect(mocks.rm).not.toHaveBeenCalled();
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

			expect(mocks.uploadStream).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledWith(body.file);
			await expect(mocks.rm).rejects.toThrow();
		});

		it('should fail if file is already being uploaded', async () => {
			vi.spyOn(server.tracker, 'has') //
				.mockReturnValueOnce(false)
				.mockReturnValueOnce(true);

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
				body: MockBody({
					app: 'app_id',
					stream: 'stream_id',
					file: '/invalid/video.flv'
				})
			});

			expect(response.statusCode).toBe(400);
			expect(response.json()).toStrictEqual({ code: 1 });
		});

		it('should fail with invalid file extension', async () => {
			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body: MockBody({
					app: 'app_id',
					stream: 'stream_id',
					file: '/data/video.txt'
				})
			});

			expect(response.statusCode).toBe(400);
			expect(response.json()).toStrictEqual({ code: 1 });
		});

		it("should fail if file doesn't exist", async () => {
			mocks.existsSync.mockReturnValueOnce(false);

			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body: MockBody({
					app: 'app_id',
					stream: 'stream_id',
					file: '/data/app_id/stream_id/video.flv'
				})
			});

			expect(response.statusCode).toBe(400);
			expect(response.json()).toStrictEqual({ code: 1 });

			expect(mocks.existsSync).toHaveBeenCalledTimes(1);
		});
	});
});
