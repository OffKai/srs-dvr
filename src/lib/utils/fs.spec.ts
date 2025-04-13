import { resolve } from 'node:path';
import { resolveFilePath, verifyFilePath } from './fs.js';
import { RECORDINGS_PATH } from './constants.js';
import { server } from '../../server.js';

const mocks = vi.hoisted(() => {
	return {
		isDev: vi.fn(() => false),
		existsSync: vi.fn()
	};
});

vi.mock('./constants.js', async (og) => {
	return Object.defineProperty(await og(), 'isDev', {
		get: mocks.isDev
	});
});
vi.mock('node:fs', () => {
	return {
		existsSync: mocks.existsSync
	};
});

describe('filesystem utilities', () => {
	describe('resolveFilePath', () => {
		it('should be relative for development', () => {
			mocks.isDev.mockReturnValue(true);

			const result = resolveFilePath('/data/test');

			expect(result).toBe(resolve('data/test'));
		});

		it('should be absolute for production', () => {
			mocks.isDev.mockReturnValue(false);

			const result = resolveFilePath(`${server.config.storage.dataRoot}/test`);

			expect(result).toBe(`${RECORDINGS_PATH}/test`);
		});

		it('should return original for same roots', () => {
			mocks.isDev.mockReturnValue(false);

			const path = `${RECORDINGS_PATH}/test`;
			const result = resolveFilePath(path);

			expect(result).toBe(path);
		});

		it('should return original for invalid root', () => {
			mocks.isDev.mockReturnValue(false);

			const result = resolveFilePath('/wrong_dir/test');

			expect(result).toBe(null);
		});
	});

	describe('verifyFilePath', () => {
		it('should be true for development', () => {
			mocks.isDev.mockReturnValue(true);

			const result = verifyFilePath('/data/test');

			expect(result).toBe(true);
			expect(mocks.existsSync).not.toHaveBeenCalled();
		});

		it('should fail with invalid extension', () => {
			const result = verifyFilePath('/data/recording.txt');

			expect(result).toBe(false);
			expect(mocks.existsSync).not.toHaveBeenCalled();
		});

		it('should pass if file exists', () => {
			mocks.existsSync.mockReturnValueOnce(true);

			const result = verifyFilePath('/data/recording.flv');

			expect(result).toBe(true);
			expect(mocks.existsSync).toHaveBeenCalledOnce();
		});

		it('should fail if file does not exist', () => {
			mocks.existsSync.mockReturnValueOnce(false);

			const result = verifyFilePath('/data/recording.flv');

			expect(result).toBe(false);
			expect(mocks.existsSync).toHaveBeenCalledOnce();
		});
	});
});
