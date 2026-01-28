
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';
  import { fileURLToPath } from 'url';

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  export default defineConfig({
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api/synapse': {
          target: 'https://admin-launcher-api-synapse-dev.dolong-4e5.workers.dev',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/synapse/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              proxyReq.setHeader('x-api-key', 'TZ3eYpuOwDfm6CEyLJyLmN0y');
            });
          },
        },
      },
    },
  });