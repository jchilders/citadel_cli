import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'citadel',
      formats: ['es', 'umd'],
      fileName: (format) => `citadel.${format === 'es' ? 'js' : 'umd.cjs'}`
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
