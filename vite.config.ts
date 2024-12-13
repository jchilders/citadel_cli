/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-css',
      enforce: 'post',
      generateBundle(_, bundle) {
        // Find the CSS file
        const cssFile = Object.keys(bundle).find(key => key.endsWith('.css'));
        if (cssFile) {
          const css = bundle[cssFile].source;
          
          // Inject CSS into JS bundles
          Object.keys(bundle).forEach(fileName => {
            if (fileName.endsWith('.js')) {
              const js = bundle[fileName];
              js.code = `
                (function() {
                  var style = document.createElement('style');
                  style.textContent = ${JSON.stringify(css)};
                  document.head.appendChild(style);
                })();
                ${js.code}
              `;
            }
          });

          // Remove the CSS file from the bundle
          delete bundle[cssFile];
        }
      }
    }
  ],
  server: {
    proxy: {
      '/api/cowsay': {
        target: 'https://cowsay.morecode.org/say',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path.replace(/^\/api\/cowsay/, ''), 'http://dummy');
          return `?${url.searchParams.toString()}`;
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/components/Citadel/Citadel.tsx'),
      name: 'Citadel',
      formats: ['es', 'umd'],
      fileName: (format) => `citadel.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css';
          return assetInfo.name;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright',
    },
  },
})
