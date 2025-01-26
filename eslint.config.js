import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPrettier from 'eslint-plugin-prettier/recommended';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} */
export const baseConfig = {
	name: 'offkai/eslint-config',
	languageOptions: {
		globals: {
			...globals.node,
			...globals.es2017,
			...globals.es2020,
			...globals.commonjs
		},
		parser: tseslint.parser,
		parserOptions: {
			project: ['./tsconfig.eslint.json'],
			sourceType: 'module',
			ecmaVersion: 2022,
			warnOnUnsupportedTypeScriptVersion: true
		}
	},
	rules: {
		'@typescript-eslint/ban-ts-comment': [
			'error',
			{
				'ts-expect-error': 'allow-with-description',
				'ts-ignore': 'allow-with-description'
			}
		]
	}
};

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} */
const config = tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	baseConfig,
	eslintPrettier,
	{
		name: 'offkai/eslint-config/cjs',
		files: ['**/*.cjs'],
		rules: {
			'@typescript-eslint/no-require-imports': 'off'
		}
	},
	{
		name: 'offkai/ignore',
		ignores: ['.husky/', '.yarn/', 'node_modules/', '**/dist/', '**/*.d.ts', '**/coverage/']
	}
);

export default config;
