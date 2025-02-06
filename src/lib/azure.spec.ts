import { server } from '../server.js';
import { routes } from '../routes.js';
import type { DvrWebhookPayload } from './types.js';
import { getFilePath } from './fs.js';
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

vi.mock('node:fs', () => ({ createReadStream: mocks.createReadStream }));
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

describe('/v1/azure', () => {
	beforeAll(async () => {
		await server.register(routes);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	const path = '/data/test.txt';
	const localPath = getFilePath(path);

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
		expect(mocks.createReadStream).toHaveBeenCalledTimes(1);
		expect(mocks.createReadStream).toHaveBeenCalledWith(localPath);
		expect(mocks.uploadStream).toHaveBeenCalledTimes(1);
		expect(mocks.setTimeout).not.toHaveBeenCalled();
		expect(mocks.rm).toHaveBeenCalledTimes(1);
		expect(mocks.rm).toHaveBeenCalledWith(localPath);
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
		expect(mocks.createReadStream).toHaveBeenCalledTimes(1);
		expect(mocks.createReadStream).toHaveBeenCalledWith(localPath);
		expect(mocks.uploadStream).toHaveBeenCalledTimes(2);
		expect(mocks.setTimeout).toHaveBeenCalledTimes(1);
		expect(mocks.rm).toHaveBeenCalledTimes(1);
		expect(mocks.rm).toHaveBeenCalledWith(localPath);
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
		expect(mocks.createReadStream).toHaveBeenCalledTimes(1);
		expect(mocks.createReadStream).toHaveBeenCalledWith(localPath);
		expect(mocks.uploadStream).toHaveBeenCalledTimes(1);
		expect(mocks.setTimeout).not.toHaveBeenCalled();
		expect(mocks.rm).toHaveBeenCalledTimes(1);
		expect(mocks.rm).toHaveBeenCalledWith(localPath);
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
		expect(mocks.createReadStream).toHaveBeenCalledTimes(1);
		expect(mocks.createReadStream).toHaveBeenCalledWith(localPath);
		expect(mocks.uploadStream).toHaveBeenCalledTimes(5);
		expect(mocks.setTimeout).toHaveBeenCalledTimes(4);
		expect(mocks.rm).not.toHaveBeenCalled();
	});
});
