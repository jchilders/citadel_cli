import type { Plugin } from 'vite';

interface ShadowDOMPluginOptions {
  include?: string[];
  exclude?: string[];
  injectMethod?: 'constructable' | 'template';
}

export function viteShadowDOM(options: ShadowDOMPluginOptions = {}): Plugin {
  const {
    include = ['src/**/*.{ts,tsx}'],
    exclude = ['node_modules/**'],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    injectMethod = 'constructable'
  } = options;

  return {
    name: 'vite-plugin-shadow-dom',
    enforce: 'post',
    
    transform(code, id) {
      // Only process relevant files
      const makeRegExp = (pattern: string) => {
        // Convert glob pattern to RegExp
        return new RegExp(pattern
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special RegExp chars
          .replace(/\*/g, '.*') // Convert * to .*
          .replace(/\*\*/g, '.*') // Convert ** to .*
        );
      };

      if (!include.some(pattern => id.match(makeRegExp(pattern))) || 
          exclude.some(pattern => id.match(makeRegExp(pattern)))) {
        return;
      }

      // Add a console log to verify the plugin is running
      const injectedCode = `
        console.log('[Shadow DOM Plugin] Processed:', '${id}');
        ${code}
      `;

      return injectedCode;
    }
  };
}
