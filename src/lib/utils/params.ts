/**
 * Determines if a stream should be uploaded based on URL parameters.
 * @param param - URL search parameters as a string
 *
 * @example
 * ```
 * const shouldUpload = shouldUpload('dvr=false&start=1746915970');
 * console.log(shouldUpload); // false
 * ```
 */
export function shouldUpload(param: string): boolean {
	if (param === '') {
		return true;
	}

	const params = new URLSearchParams(param);

	const dvr = params.get('dvr');
	if (dvr === 'false') {
		return false;
	}

	const start = params.get('start');
	if (start === null) {
		return true;
	}

	const coerce = Number.parseInt(start, 10);
	if (Number.isNaN(coerce)) {
		return true;
	}

	if (coerce > Date.now()) {
		return false;
	}

	return true;
}
