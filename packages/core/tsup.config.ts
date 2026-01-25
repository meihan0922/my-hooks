import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/*'], // specify entry files
  dts: true, // generate .d.ts files
  splitting: false, // disable code splitting，每個入口文件都會生成一個單獨的輸出文件
  sourcemap: false, // disable source maps
  minify: true, // enable minification
  clean: true, // clean output directory before each build
  format: ['esm'], // output format
  outDir: 'es', // output directory
  outExtension: () => ({ js: '.js' }), // output file extension
});
