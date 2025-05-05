import type { S3Client } from '@aws-sdk/client-s3';
import { MockBody } from '../../mocks/request.js';
import { server } from '../../server.js';
import { s3Routes } from './routes.js';

const mocks = vi.hoisted(() => {
	return {
		send: vi.fn()
	};
});

vi.mock('./client.js', () => ({
	getS3Client: vi.fn<() => Partial<S3Client>>(() => {
		return {
			send: mocks.send
		};
	})
}));

describe('S3 routes', () => {
	beforeAll(async () => {
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
