import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      src: resolve(__dirname, 'src'),
    },
  },
  test: {
    reporters: ['default', 'verbose'],
    environment: 'jsdom',
    include: ['src/**/__tests__/*.spec.ts?(x)'],
    coverage: {
      provider: 'istanbul', // 指定作為覆蓋率數據收集器
      reporter: ['text', 'lcov'],
    },
  },
});
