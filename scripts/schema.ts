import { DvrConfigSchema } from '../src/lib/config/schema.js';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import prettier from 'prettier';
import { z } from 'zod/v4';

const schemas: [string, z.core.$ZodType][] = [
	['v0', DvrConfigSchema] //
];

for (const [version, schema] of schemas) {
	const jsonSchema = z.toJSONSchema(schema, {
		target: 'draft-7'
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
