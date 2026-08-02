import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    environment: 'jsdom',
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
    restoreMocks: true,
    setupFiles: ['./tests/setup.ts'],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules\/three\// },
            { name: 'react-three', test: /node_modules\/@react-three\/(?:fiber|drei)\// },
            { name: 'supabase', test: /node_modules\/@supabase\// },
            { name: 'tiptap', test: /node_modules\/@tiptap\// },
          ],
        },
      },
    },
  },
});
