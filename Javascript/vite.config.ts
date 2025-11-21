import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths instead of absolute paths from root
  build: {
    sourcemap: true,
  },
  server: {
    sourcemapIgnoreList: false,
  },
});
