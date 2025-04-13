import { defineConfig } from 'tsup';

export default defineConfig({
	bundle: true,
	clean: true,
	dts: false,
	entry: ['src/main.ts', '!src/**/*.spec.ts', '!src/mocks/**/*.ts'],
	format: ['esm'],
	keepNames: true,
	minify: false,
	shims: false,
	skipNodeModulesBundle: true,
	splitting: false,
	sourcemap: true,
	target: 'es2024',
	treeshake: 'smallest',
	tsconfig: 'tsconfig.json',
	outDir: 'dist',
	env: {
		NODE_ENV: process.env.NODE_ENV ?? 'production',
		TESTING: 'false',
		npm_package_version: process.env.npm_package_version!
	}
});
