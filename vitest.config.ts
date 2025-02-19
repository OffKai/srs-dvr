import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		env: {
			NODE_ENV: 'development',
			TESTING: 'true'
		},
		coverage: {
			provider: 'v8',
			reporter: ['text'],
			exclude: [...(configDefaults.coverage.exclude ?? []), 'src/mocks/**']
		},
		clearMocks: true,
		mockReset: true,
		setupFiles: []
	}
});
