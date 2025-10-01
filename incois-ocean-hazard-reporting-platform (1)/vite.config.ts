import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    
    // Path resolution
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
        '@components': path.resolve(__dirname, './components'),
        '@services': path.resolve(__dirname, './services'),
        '@utils': path.resolve(__dirname, './utils'),
        '@types': path.resolve(__dirname, './types.ts'),
        '@constants': path.resolve(__dirname, './constants.ts'),
      },
    },
    
    // Development server configuration
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: false,
      cors: true,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    
    // Preview server configuration
    preview: {
      port: 4173,
      host: true,
    },
    
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'esbuild' : false,
      target: 'es2020',
      
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            maps: ['leaflet'],
            utils: ['uuid'],
          },
        },
      },
      
      // Build optimizations
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096,
    },
    
    // Optimization
    optimizeDeps: {
      include: ['react', 'react-dom', 'leaflet', 'uuid'],
      exclude: ['@google/genai'],
    },
    
    // Environment variables
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    
    // Performance optimizations
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
  };
});
