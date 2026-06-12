import { defineConfig } from 'vitepress';

// Published under the demo's GitHub Pages site at /citadel_cli/docs/
// (the deploy-pages workflow copies the docs build into dist-demo/docs).
export default defineConfig({
  title: 'citadel_cli',
  description: 'Keyboard-driven command console for React apps',
  base: '/citadel_cli/docs/',

  // README.md stays the index so the docs remain browsable on GitHub;
  // VitePress serves it as the site root.
  rewrites: {
    'README.md': 'index.md',
  },

  // Type-checked code samples backing the docs — not pages.
  srcExclude: ['examples/**'],

  themeConfig: {
    nav: [
      { text: 'Live Demo', link: 'https://jchilders.github.io/citadel_cli/' },
      { text: 'npm', link: 'https://www.npmjs.com/package/citadel_cli' },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/jchilders/citadel_cli' },
    ],
    sidebar: [
      { text: 'Overview', link: '/' },
      {
        text: 'Guide',
        items: [
          { text: 'Installing in a React app', link: '/01-installing-citadel-in-an-existing-react-app' },
          { text: 'Defining commands', link: '/02-defining-commands' },
          { text: 'Embedding & display modes', link: '/03-embedding-and-display-modes' },
          { text: 'Configuration & history', link: '/04-configuring-citadel-and-command-history' },
          { text: 'Integration recipes', link: '/05-using-integration-recipes' },
        ],
      },
    ],
    outline: 'deep',
  },
});
