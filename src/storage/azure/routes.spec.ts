import { ReadStream } from 'node:fs';
import { MockBody } from '../../mocks/request.js';
import { server } from '../../server.js';
import { RECORDINGS_PATH } from '../../lib/utils/constants.js';
import { flushPromises } from '../../mocks/utils.js';
import type { DvrWebhookPayload } from '../../lib/types/srs.js';
import { storagePreHandlerHook } from '../handlers.js';
import { azureRoutes } from './routes.js';

const mocks = vi.hoisted(() => {
	return {
		azureUpload: vi.fn(),
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
vi.mock('./upload.js', () => {
	return {
		azureUpload: mocks.azureUpload
	};
});

describe('Azure routes', () => {
	beforeAll(async () => {
		server.addHook('preHandler', storagePreHandlerHook);
		await server.register(azureRoutes);
	});

	beforeEach(() => {
		server.tracker.clear();
	});

	describe('logic', () => {
		const body = MockBody({
			app: 'app_id',
			stream: 'stream_id',
			file: `${server.config.storage.dataRoot}/app_id/stream_id/recording.flv`
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

			expect(mocks.azureUpload).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledWith(`${RECORDINGS_PATH}/app_id/stream_id/recording.flv`);
		});

		test('azureUpload throws error', async () => {
			mocks.azureUpload.mockRejectedValueOnce(new Error());

			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });

			expect(mocks.azureUpload).toHaveBeenCalledTimes(1);
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

			expect(mocks.azureUpload).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledWith(`${RECORDINGS_PATH}/app_id/stream_id/recording.flv`);
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

			expect(resOne.statusCode).toBe(200);
			expect(resOne.json()).toStrictEqual({ code: 0 });

			const resTwo = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			expect(resTwo.statusCode).toBe(400);
			expect(resTwo.json()).toStrictEqual({ code: 1 });
		});
	});

	describe('validation', () => {
		const body = MockBody({
			app: 'app_id',
			stream: 'stream_id',
			file: '/invalid/recording.flv'
		});

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
				body: {
					...body,
					file: '/invalid/recording.flv'
				} satisfies DvrWebhookPayload
			});

			expect(response.statusCode).toBe(400);
			expect(response.json()).toStrictEqual({ code: 1 });

			expect(mocks.existsSync).not.toHaveBeenCalled();
		});

		it('should fail with invalid file extension', async () => {
			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body: {
					...body,
					file: `${server.config.storage.dataRoot}/recording.txt`
				} satisfies DvrWebhookPayload
			});

			expect(response.statusCode).toBe(400);
			expect(response.json()).toStrictEqual({ code: 1 });

			expect(mocks.existsSync).not.toHaveBeenCalled();
		});

		it("should fail if file doesn't exist", async () => {
			mocks.existsSync.mockReturnValueOnce(false);

			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body: {
					...body,
					file: `${server.config.storage.dataRoot}/app_id/stream_id/recording.flv`
				} satisfies DvrWebhookPayload
			});

			expect(response.statusCode).toBe(400);
			expect(response.json()).toStrictEqual({ code: 1 });

			expect(mocks.existsSync).toHaveBeenCalledOnce();
		});
	});

	describe('dvr param', () => {
		const body = MockBody({
			app: 'app_id',
			stream: 'stream_id',
			file: `${server.config.storage.dataRoot}/app_id/stream_id/recording.flv`
		});

		it('should skip upload with dvr=false', async () => {
			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body: {
					...body,
					param: '?dvr=false'
				} satisfies DvrWebhookPayload
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });

			expect(mocks.azureUpload).not.toHaveBeenCalled();
			expect(mocks.rm).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledWith(`${RECORDINGS_PATH}/app_id/stream_id/recording.flv`);
		});

		it('should upload with dvr=true', async () => {
			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body: {
					...body,
					param: '?dvr=true'
				} satisfies DvrWebhookPayload
			});

			await flushPromises();

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });

			expect(mocks.azureUpload).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledWith(`${RECORDINGS_PATH}/app_id/stream_id/recording.flv`);
		});

		it('should skip upload with dvr=undefined', async () => {
			const response = await server.inject({
				method: 'POST',
				url: '/v1/azure',
				body
			});

			await flushPromises();

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });

			expect(mocks.azureUpload).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledTimes(1);
			expect(mocks.rm).toHaveBeenCalledWith(`${RECORDINGS_PATH}/app_id/stream_id/recording.flv`);
		});
	});
});
