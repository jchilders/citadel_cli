import fs from 'fs'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// ANSI escape codes for colors
const GREEN = '\x1b[32m'
const RESET = '\x1b[0m'

// Create a minimal CSS file that imports Tailwind
const css = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`

// Custom PostCSS plugin to scope all selectors
const scopeSelectors = (scope = '.citadel-root') => {
  return {
    postcssPlugin: 'scope-selectors',
    Once(root) {
      root.walkRules(rule => {
        // Skip if rule is already scoped or is a keyframe
        if (
          rule.selector.includes(scope) || 
          rule.parent.type === 'atrule' && 
          rule.parent.name === 'keyframes'
        ) {
          return
        }

        // Skip root level at-rules
        if (rule.selector.startsWith('@')) {
          return
        }

        // Handle comma-separated selectors
        const selectors = rule.selector.split(',').map(s => {
          s = s.trim()
          // Don't scope html, body, or :root selectors
          if (['html', 'body', ':root'].includes(s)) {
            return s
          }
          return `${scope} ${s}`
        })

        rule.selector = selectors.join(',')
      })
    }
  }
}
scopeSelectors.postcss = true

async function buildCSS() {
  const startTime = performance.now()

  const result = await postcss([
    tailwindcss('./tailwind.config.js'),
    autoprefixer,
    scopeSelectors()
  ]).process(css, {
    from: undefined,
    to: 'dist/styles.css'
  })

  fs.mkdirSync('dist', { recursive: true })
  fs.writeFileSync('dist/styles.css', result.css)
  
  if (result.map) {
    console.log(`  Creating styles.css.map`)
    fs.writeFileSync('dist/styles.css.map', result.map.toString())
  } else {
    console.log(`  Skipping styles.css.map`)
  }

  const executionTime = Math.round(performance.now() - startTime)
  const fileSizeKB = Math.round(result.css.length / 1024)
  
  console.log(`${GREEN}✓${RESET} Built dist/styles.css (${fileSizeKB}kb) in ${executionTime}ms`)
  if (result.map) {
    console.log(`${GREEN}   • also: dist/styles.css.map${RESET}`)
  }
}

buildCSS().catch(err => {
  console.error('Error building CSS:', err)
  process.exit(1)
})
