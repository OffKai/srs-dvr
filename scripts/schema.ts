import { zodToJsonSchema } from 'zod-to-json-schema';
import { DvrConfigSchema } from '../src/lib/config/schema.js';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import prettier from 'prettier';
import type { ZodSchema } from 'zod';

const schemas: [string, ZodSchema][] = [
	['v0', DvrConfigSchema] //
];

for (const [version, schema] of schemas) {
	const jsonSchema = zodToJsonSchema(schema, {
		target: 'jsonSchema7'
	});

	const strSchema = JSON.stringify(jsonSchema, null, 2);

	const path = resolve(`schemas/schema.${version}.json`);

	const options = await prettier.resolveConfig(path);
	const formatted = await prettier.format(strSchema, {
		...options,
		filepath: path
	});

	await writeFile(path, formatted);

	console.log(`schema.${version}.json generated`);
}
