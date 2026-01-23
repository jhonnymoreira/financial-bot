import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineWorkersConfig({
  plugins: [tsconfigPaths()],
  test: {
    clearMocks: true,
    coverage: {
      provider: 'istanbul',
      reporter: ['text'],
      reportOnFailure: true,
    },
    globals: true,
    mockReset: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          compatibilityFlags: [
            'enable_nodejs_fs_module',
            'enable_nodejs_http_modules',
            'enable_nodejs_perf_hooks_module',
            'enable_nodejs_tty_module',
          ],
        },
      },
    },
    reporters: ['verbose'],
    restoreMocks: true,
    watch: false,
  },
});
