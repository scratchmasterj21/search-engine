import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Adjust this if you have a specific base path
  build: {
    outDir: 'dist',
  },
});
