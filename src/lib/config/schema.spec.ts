import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { DvrConfigSchema } from './schema.js';
import { resolve } from 'node:path';

/**
 * Any changes to the JSON structure might be a breaking change.
 */
describe('JSON schema', () => {
	describe('V0', () => {
		it('saved should match current', async () => {
			const path = resolve('schemas/schema.v0.json');
			expect(existsSync(path)).toBe(true);

			const file = await readFile(path, 'utf8');
			const savedSchema = JSON.parse(file);

			const currentSchema = zodToJsonSchema(DvrConfigSchema, {
				target: 'jsonSchema7'
			});

			expect(savedSchema).toStrictEqual(currentSchema);
		});
	});
});
