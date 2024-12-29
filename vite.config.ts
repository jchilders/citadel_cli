/// <reference types="vitest" />
import { defineConfig, Plugin, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import type { OutputBundle, OutputAsset, OutputChunk, PreRenderedAsset } from 'rollup';

interface CSSInjectionPluginOptions {
  removeOriginalCss?: boolean;
}

function createCssInjectionPlugin(options: CSSInjectionPluginOptions = {}): Plugin {
  const { removeOriginalCss = true } = options;

  return {
    name: 'inject-css',
    enforce: 'post',
    generateBundle(_, bundle: OutputBundle) {
      // Find the CSS file
      const cssFile = Object.keys(bundle).find(key => key.endsWith('.css'));
      if (!cssFile) return;

      const cssAsset = bundle[cssFile] as OutputAsset;
      if (cssAsset.type !== 'asset') return;

      const css = cssAsset.source;
      
      // Inject CSS into JS bundles
      Object.keys(bundle).forEach(fileName => {
        if (fileName.endsWith('.js')) {
          const js = bundle[fileName] as OutputChunk;
          if (js.type !== 'chunk') return;

          js.code = `
            (function() {
              const style = document.createElement('style');
              style.textContent = ${JSON.stringify(css)};
              document.head.appendChild(style);
            })();
            ${js.code}
          `;
        }
      });

      // Remove the CSS file from the bundle if configured
      if (removeOriginalCss) {
        delete bundle[cssFile];
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    createCssInjectionPlugin(),
  ],
  server: {
    proxy: {
      '/api/cowsay': {
        target: 'https://cowsay.morecode.org',
        changeOrigin: true,
        rewrite: (path: string) => path.replace('/api/cowsay', '/say'),
      },
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/components/Citadel/Citadel.tsx'),
      name: 'Citadel',
      formats: ['es', 'umd'] as const,
      fileName: (format: string) => `citadel.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: (assetInfo: PreRenderedAsset): string => {
          if (assetInfo.name === 'style.css') return 'style.css';
          return assetInfo.name || '[name][extname]';
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/*.d.ts',
        'test/**',
        '**/*.test.{ts,tsx}',
      ],
    },
  },
} satisfies UserConfig);
