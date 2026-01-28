import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*/vitest.config.ts'],
    coverage: {
      provider: 'istanbul', // 指定作為覆蓋率數據收集器
      include: ['packages/*/src/**/*.ts?(x)'],
      reporter: ['text', 'lcov'],
    },
  },
});
