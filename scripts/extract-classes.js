// scripts/extract-classes.js
import fs from 'fs'
import path from 'path'

// ANSI escape codes for colors
const GREEN = '\x1b[32m'
const RESET = '\x1b[0m'

function extractClassesFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Match className="..." and className={`...`}
  const classNameRegex = /className=["'`]{1}([^"'`]+)["'`]{1}|className=\{[`"']([^`"']+)[`"']\}/g
  const matches = [...content.matchAll(classNameRegex)]
  
  // Collect all class names from matches
  const classes = new Set()
  matches.forEach(match => {
    // match[1] for regular strings, match[2] for template literals
    const classString = match[1] || match[2]
    if (classString) {
      // Split on whitespace and add each class
      classString.split(/\s+/).forEach(cls => {
        // Skip any template literal expressions
        if (!cls.includes('${')) {
          classes.add(cls)
        }
      })
    }
  })
  
  return Array.from(classes)
}

function scanDirectory(dir) {
  const allClasses = new Set()
  
  // Read all TypeScript/JavaScript files in src
  const files = fs.readdirSync(dir)
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      const subDirClasses = scanDirectory(filePath)
      subDirClasses.forEach(cls => allClasses.add(cls))
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      // Process TypeScript/JavaScript files
      const fileClasses = extractClassesFromFile(filePath)
      fileClasses.forEach(cls => allClasses.add(cls))
    }
  })
  
  return Array.from(allClasses).sort()
}

const startTime = performance.now()

const classes = scanDirectory('./src')

let configContent = fs.readFileSync('tailwind.config.js', 'utf-8')

const safelistStart = configContent.indexOf('safelist:')
if (safelistStart === -1) {
  console.error('Could not find safelist in tailwind.config.js')
  process.exit(1)
}

// Find the matching closing bracket
let openBrackets = 0
let safelistEnd = safelistStart
for (let i = safelistStart; i < configContent.length; i++) {
  if (configContent[i] === '[') openBrackets++
  if (configContent[i] === ']') {
    openBrackets--
    if (openBrackets === 0) {
      safelistEnd = i + 1
      break
    }
  }
}

// Create new config content
const newSafelist = `safelist: ${JSON.stringify(classes, null, 2)}`
const updatedConfig = 
  configContent.substring(0, safelistStart) + 
  newSafelist + 
  configContent.substring(safelistEnd)

fs.writeFileSync('tailwind.config.js', updatedConfig)

const executionTime = Math.round(performance.now() - startTime)

console.log(`${GREEN}✓${RESET} Inlined ${classes.length} TailwindCSS class names to tailwind.config.js in ${executionTime}ms`)
