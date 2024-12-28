/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json'
    },
    coverage: {
      exclude: ['node_modules', 'dist', 'command_examples', 'prompts', '.cache',
        '*.js', '*.cjs', '*.ts', // exclude config files in project root
        'src/App.tsx', 'src/index.ts', 'src/main.tsx', // exclude entry files
        'src/components/Citadel/index.ts',
        'src/components/Citadel/types/index.ts',
      ],
    }
  }
})