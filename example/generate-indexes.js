const fs = require('fs');
const path = require('path');

function shouldIgnoreFile(filename) {
  return filename === 'index.ts' || filename.startsWith('.');
}

function shouldIgnoreDirectory(dirName) {
  return dirName === 'typechains';
}

function generateIndexContent(files, isRoot = false) {
  const exports = files
    .map((file) => {
      const filename = path.basename(file, path.extname(file));
      if (isRoot && filename !== 'index') {
        return `export * from './${filename}';`;
      }
      return `export * from './${filename}';`;
    })
    .join('\n');

  return exports ? exports + '\n' : '';
}

function deleteIndexFiles(dirPath) {
  const indexPath = path.join(dirPath, 'index.ts');
  if (fs.existsSync(indexPath)) {
    fs.unlinkSync(indexPath);
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  entries
    .filter((entry) => entry.isDirectory())
    .forEach((dir) => {
      deleteIndexFiles(path.join(dirPath, dir.name));
    });
}

function processModule(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  const jsFiles = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith('.ts') &&
        !shouldIgnoreFile(entry.name)
    )
    .map((entry) => path.join(dirPath, entry.name));

  const subdirectories = entries.filter((entry) => entry.isDirectory());
  const subDirExports = subdirectories
    .map((dir) => {
      const subdirPath = path.join(dirPath, dir.name);
      processModule(subdirPath);

      if (fs.readdirSync(subdirPath).length > 0) {
        return `export * from './${dir.name}';`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');

  let content = '';

  if (jsFiles.length > 0) {
    content += generateIndexContent(jsFiles, path.basename(dirPath) === 'src');
  }

  if (subDirExports) {
    content += (content ? '\n' : '') + subDirExports + '\n';
  }

  if (content) {
    fs.writeFileSync(path.join(dirPath, 'index.ts'), content);
  }
}

function generateLibsIndexes() {
  const currentDir = process.cwd();
  const libsDir = path.join(currentDir, 'libs');

  if (!fs.existsSync(libsDir)) {
    console.error(`Directory ${libsDir} does not exist!`);
    process.exit(1);
  }

  const libModules = fs
    .readdirSync(libsDir, { withFileTypes: true })
    .filter(
      (dirent) => dirent.isDirectory() && !shouldIgnoreDirectory(dirent.name)
    )
    .map((dirent) => dirent.name);

  libModules.forEach((moduleName) => {
    const srcPath = path.join(libsDir, moduleName, 'src');
    if (fs.existsSync(srcPath)) {
      console.log(`\nProcessing module: ${moduleName}`);
      console.log('Cleaning up old index files...');
      deleteIndexFiles(srcPath);
      console.log('Generating new index files...');
      processModule(srcPath);
    } else {
      console.warn(`Warning: src directory not found in ${moduleName}`);
    }
  });
}

try {
  generateLibsIndexes();
  console.log('\nSuccessfully regenerated all index.ts files!');
} catch (error) {
  console.error('Error generating index files:', error);
  process.exit(1);
}
