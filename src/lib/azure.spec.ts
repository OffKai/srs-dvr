import { upload } from './azure.js';
import { basename } from 'node:path';
import { getFilePath } from './fs.js';

const mocks = vi.hoisted(() => {
	return {
		createReadStream: vi.fn(),
		rm: vi.fn(),
		setTimeout: vi.fn(),
		uploadStream: vi.fn()
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
		vi.clearAllMocks();
		vi.useFakeTimers({ toFake: ['setTimeout'] });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	const path = '/data/test.txt';
	const localPath = getFilePath(path);
	const filename = basename(path);

	it('should upload a file', async () => {
		await upload(filename, localPath);

		expect(mocks.createReadStream).toHaveBeenCalledTimes(1);
		expect(mocks.createReadStream).toHaveBeenCalledWith(localPath);
		expect(mocks.uploadStream).toHaveBeenCalledTimes(1);
		expect(mocks.setTimeout).not.toHaveBeenCalled();
		expect(mocks.rm).toHaveBeenCalledTimes(1);
		expect(mocks.rm).toHaveBeenCalledWith(localPath);
	});

	test('uploadStream throws error once', async () => {
		mocks.uploadStream //
			.mockRejectedValueOnce(new Error())
			.mockResolvedValueOnce(undefined);

		await upload(filename, localPath);

		expect(mocks.createReadStream).toHaveBeenCalledTimes(1);
		expect(mocks.createReadStream).toHaveBeenCalledWith(localPath);
		expect(mocks.uploadStream).toHaveBeenCalledTimes(2);
		expect(mocks.setTimeout).toHaveBeenCalledTimes(1);
		expect(mocks.rm).toHaveBeenCalledTimes(1);
		expect(mocks.rm).toHaveBeenCalledWith(localPath);
	});

	test('rm throws error', async () => {
		mocks.rm.mockRejectedValue(new Error());

		await upload(filename, localPath);

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

		await upload(filename, localPath);

		expect(mocks.createReadStream).toHaveBeenCalledTimes(1);
		expect(mocks.createReadStream).toHaveBeenCalledWith(localPath);
		expect(mocks.uploadStream).toHaveBeenCalledTimes(5);
		expect(mocks.setTimeout).toHaveBeenCalledTimes(4);
		expect(mocks.rm).not.toHaveBeenCalled();
	});

	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
	it('stuck', async () => {
		await sleep(1000); // it's sleeping forever
		vi.runAllTimers();
	});
});
