import { shouldUpload } from './params.js';

describe('Param utils', () => {
	describe('shouldUpload', () => {
		it('should upload with no params', () => {
			const result = shouldUpload('');
			expect(result).toBe(true);
		});

		it('should upload with `dvr` true', () => {
			const result = shouldUpload('dvr=true');
			expect(result).toBe(true);
		});

		it('should not upload with `dvr` false', () => {
			const result = shouldUpload('dvr=false');
			expect(result).toBe(false);
		});

		it('should upload with `start` in the past', () => {
			const result = shouldUpload(`start=${Date.now() - 1000 * 60 * 60}`);
			expect(result).toBe(true);
		});

		it('should not upload with `start` in the future', () => {
			const result = shouldUpload(`start=${Date.now() + 1000 * 60 * 60}`);
			expect(result).toBe(false);
		});

		it('should not upload with `dvr` false and `start` in the past', () => {
			const result = shouldUpload(`dvr=false&start=${Date.now() - 1000 * 60 * 60}`);
			expect(result).toBe(false);
		});

		it('should not upload with `dvr` true and `start` in the future', () => {
			const result = shouldUpload(`dvr=true&start=${Date.now() + 1000 * 60 * 60}`);
			expect(result).toBe(false);
		});
	});
});
