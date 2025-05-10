import { MockBody } from '../../mocks/request.js';
import { server } from '../../server.js';
import { s3Routes } from './routes.js';
import { storagePreHandlerHook } from '../handlers.js';
import { ReadStream } from 'node:fs';

const mocks = vi.hoisted(() => {
	return {
		s3Upload: vi.fn(),
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
		s3Upload: mocks.s3Upload
	};
});

describe('S3 routes', () => {
	beforeAll(async () => {
		server.addHook('preHandler', storagePreHandlerHook);
		await server.register(s3Routes);
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
				url: '/v1/s3',
				body
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual({ code: 0 });
		});
	});
});
