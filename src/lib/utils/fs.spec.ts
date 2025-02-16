import type { TrackerVideo } from '../types/srs.js';
import { fmtUploadPath, tracker } from './fs.js';

const mocks = vi.hoisted(() => {
	return {
		readFile: vi.fn(),
		writeFile: vi.fn(),
		existsSync: vi.fn()
	};
});

vi.mock('node:fs', () => {
	return {
		existsSync: mocks.existsSync
	};
});
vi.mock('node:fs/promises', () => {
	return {
		readFile: mocks.readFile,
		writeFile: mocks.writeFile
	};
});

describe('File system utils', () => {
	describe('fmtUploadPath', () => {
		it('should return the path without root', () => {
			const result = fmtUploadPath({
				app: 'live',
				stream: 'livestream',
				filename: '1739732027344.flv'
			});

			expect(result).toBe('live/livestream/1739732027344.flv');
		});
	});

	describe('tracker', () => {
		const videoOne: TrackerVideo = {
			app: 'live',
			stream: 'livestream',
			filename: '123.flv',
			path: '/dvr/live/livestream/123.flv',
			storage: 'azure',
			date: '2025-01-01'
		};
		const videoTwo: TrackerVideo = {
			app: 'live',
			stream: 'livestream',
			filename: '456.flv',
			path: '/dvr/live/livestream/456.flv',
			storage: 'azure',
			date: '2025-01-01'
		};

		it('should initialize if file does not exist', async () => {
			mocks.existsSync.mockReturnValueOnce(false);

			await tracker.init();

			expect(mocks.existsSync).toHaveBeenCalledWith(tracker.path);
			expect(mocks.writeFile).toHaveBeenCalledWith(
				tracker.path, //
				JSON.stringify({ videos: [] satisfies TrackerVideo[] })
			);
		});

		it('should not initialize if file exists', async () => {
			mocks.existsSync.mockReturnValueOnce(true);

			await tracker.init();

			expect(mocks.existsSync).toHaveBeenCalledWith(tracker.path);
			expect(mocks.writeFile).not.toHaveBeenCalled();
		});

		it('should write a new id', async () => {
			const videos = [videoOne];
			mocks.readFile.mockReturnValueOnce(JSON.stringify({ videos }));

			await tracker.add(videoTwo);

			expect(mocks.readFile).toHaveBeenCalledWith(tracker.path, 'utf-8');
			expect(mocks.writeFile).toHaveBeenCalledWith(
				tracker.path, //
				JSON.stringify({ videos: [videoOne, videoTwo] }),
				'utf-8'
			);
		});

		it('should read videos', async () => {
			const videos = [videoOne, videoTwo];
			mocks.readFile.mockReturnValueOnce(JSON.stringify({ videos }));

			const result = await tracker.read();

			expect(mocks.readFile).toHaveBeenCalledWith(tracker.path, 'utf-8');
			expect(result).toEqual(videos);
		});

		it('should delete an id', async () => {
			const videos = [videoOne, videoTwo];
			mocks.readFile.mockReturnValueOnce(JSON.stringify({ videos }));

			await tracker.remove(videoOne.path);

			expect(mocks.readFile).toHaveBeenCalledWith(tracker.path, 'utf-8');
			expect(mocks.writeFile).toHaveBeenCalledWith(
				tracker.path, //
				JSON.stringify({ videos: [videoTwo] }),
				'utf-8'
			);
		});

		it('should check if an id exists', async () => {
			const videos = [videoOne, videoTwo];
			mocks.readFile.mockReturnValueOnce(JSON.stringify({ videos }));

			const result = await tracker.has(videoOne.path);

			expect(mocks.readFile).toHaveBeenCalledWith(tracker.path, 'utf-8');
			expect(result).toBe(true);
		});
	});
});
