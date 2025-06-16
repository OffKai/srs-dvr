import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { DvrConfigSchema } from './schema.js';
import { resolve } from 'node:path';
import { z } from 'zod/v4';

// Any changes to the JSON schema might be a breaking change.
describe('JSON schema', () => {
	describe('V0', () => {
		it('saved schema should match current config', async () => {
			const path = resolve('schemas/schema.v0.json');
			expect(existsSync(path)).toBe(true);

			const file = await readFile(path, 'utf8');
			const savedSchema = JSON.parse(file);

			const currentSchema = z.toJSONSchema(DvrConfigSchema, {
				target: 'draft-7'
			});

			expect(savedSchema).toStrictEqual(currentSchema);
		});
	});
});
