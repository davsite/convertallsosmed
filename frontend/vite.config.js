import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function copyToBuildDir() {
  return {
    name: 'copy-dist-to-build',
    closeBundle() {
      try {
        const distDir = path.resolve(__dirname, 'dist');
        const buildDir = path.resolve(__dirname, 'build');
        if (fs.existsSync(distDir)) {
          if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, { recursive: true });
          }
          fs.cpSync(distDir, buildDir, { recursive: true });
        }
      } catch (_) {}
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || env.REACT_APP_API_URL || process.env.REACT_APP_API_URL || process.env.VITE_API_URL || '';

  return {
    plugins: [react(), copyToBuildDir()],
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(apiUrl),
      'process.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});

