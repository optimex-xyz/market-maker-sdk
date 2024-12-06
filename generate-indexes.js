const fs = require('fs')
const path = require('path')

function shouldIgnoreFile(filename) {
  return filename === 'index.ts' || filename.startsWith('.')
}

function isTypechainsDir(dirPath) {
  return path.basename(dirPath) === 'typechains'
}

function generateIndexContent(files) {
  const exports = files
    .map((file) => {
      const filename = path.basename(file, path.extname(file))
      return `export * from './${filename}';`
    })
    .join('\n')

  return exports ? exports + '\n' : ''
}

function deleteIndexFiles(dirPath) {
  // Don't delete anything in typechains directory
  if (isTypechainsDir(dirPath)) {
    return
  }

  const indexPath = path.join(dirPath, 'index.ts')
  if (fs.existsSync(indexPath)) {
    fs.unlinkSync(indexPath)
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  entries
    .filter(
      (entry) =>
        entry.isDirectory() && !isTypechainsDir(path.join(dirPath, entry.name))
    )
    .forEach((dir) => {
      deleteIndexFiles(path.join(dirPath, dir.name))
    })
}

function processModule(dirPath) {
  // Don't process anything inside typechains directory
  if (isTypechainsDir(dirPath)) {
    return
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  // Process regular .ts files
  const jsFiles = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith('.ts') &&
        !shouldIgnoreFile(entry.name)
    )
    .map((entry) => path.join(dirPath, entry.name))

  // Handle subdirectories
  const subdirectories = entries.filter((entry) => entry.isDirectory())

  const subDirExports = subdirectories
    .map((dir) => {
      const subdirPath = path.join(dirPath, dir.name)

      // Only process non-typechains directories
      if (!isTypechainsDir(subdirPath)) {
        processModule(subdirPath)
      }

      // Always export directories (including typechains) in the parent index.ts
      return `export * from './${dir.name}';`
    })
    .filter(Boolean)
    .join('\n')

  let content = ''

  if (jsFiles.length > 0) {
    content += generateIndexContent(jsFiles)
  }

  if (subDirExports) {
    content += (content ? '\n' : '') + subDirExports + '\n'
  }

  if (content) {
    fs.writeFileSync(path.join(dirPath, 'index.ts'), content)
  }
}

function generateIndexes() {
  const srcPath = path.join(process.cwd(), 'src')

  if (!fs.existsSync(srcPath)) {
    console.error(`Directory ${srcPath} does not exist!`)
    process.exit(1)
  }

  try {
    console.log('Cleaning up old index files...')
    deleteIndexFiles(srcPath)
    console.log('Generating new index files...')
    processModule(srcPath)
    console.log('\nSuccessfully regenerated all index.ts files!')
  } catch (error) {
    console.error('Error generating index files:', error)
    process.exit(1)
  }
}

generateIndexes()
