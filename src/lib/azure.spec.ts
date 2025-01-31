import { createReadStream } from 'node:fs';
import { upload } from './azure.js';
import { basename } from 'node:path';

const mocks = vi.hoisted(() => {
	return {
		uploadStream: vi.fn(),
		createReadStream: vi.fn(),
		rm: vi.fn(),
		setTimeout: vi.fn()
	};
});

vi.mock('node:fs', () => ({ createReadStream: mocks.createReadStream }));
vi.mock('node:fs/promises', () => ({ rm: mocks.rm }));
vi.mock('node:timers', () => ({ setTimeout: mocks.setTimeout }));

vi.mock('@azure/storage-blob', () => {
	class MockBlobServiceClient {
		public getContainerClient = vi.fn().mockReturnValue({
			getBlockBlobClient: vi.fn().mockReturnValue({
				uploadStream: mocks.uploadStream
			})
		});

		public static fromConnectionString = vi.fn().mockReturnValue(new MockBlobServiceClient());
	}

	return {
		BlobServiceClient: MockBlobServiceClient
	};
});

describe('Azure upload', async () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['setTimeout'] });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	const path = '/tmp/test.txt';
	const filename = basename(path);

	it('should upload a file', async () => {
		const stream = createReadStream(path);

		await upload(filename, path);

		expect(mocks.createReadStream).toHaveBeenCalledWith(path);
		expect(mocks.uploadStream).toHaveBeenCalledWith(stream);
		expect(mocks.rm).toHaveBeenCalledWith(path);
	});

	test('uploadStream throws error', async () => {
		mocks.uploadStream.mockRejectedValue(new Error());

		await upload(filename, path);

		expect(mocks.createReadStream).toHaveBeenCalledWith(path);
		expect(mocks.setTimeout).toHaveBeenCalledTimes(5);
		expect(mocks.rm).not.toHaveBeenCalledWith(path);
	});

	test.skip('rm throws error', async () => {});

	test.skip('bail with max retries', async () => {});
});
