/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // The home page's WebGL libraries must share the app's single copy of React.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@shadergradient/react', '@paper-design/shaders-react', '@ybouane/liquidglass'],
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
