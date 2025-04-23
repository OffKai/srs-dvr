import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		env: {
			NODE_ENV: 'production',
			TESTING: 'true'
		},
		coverage: {
			provider: 'v8',
			reporter: ['text'],
			include: ['src/**'],
			exclude: [
				...(configDefaults.coverage.exclude ?? []), //
				'src/mocks/**'
			]
		},
		clearMocks: true,
		mockReset: true,
		unstubEnvs: true,
		setupFiles: []
	}
});
