/* global process, console */
const path = require('path')
const fs = require('fs')
const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default

const CONTRACTS_DIR = path.join(process.cwd(), 'src/contracts/contracts')
const OUTPUT_FILE = path.join(process.cwd(), 'src/contracts/index.ts')

function extractTypesFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['typescript'],
  })

  const types = []

  traverse(ast, {
    TSModuleDeclaration(path) {
      if (path.node.id.type === 'Identifier' && path.node.id.name === 'ITypes') {
        path.traverse({
          TSTypeAliasDeclaration(path) {
            if (path.node.id.type === 'Identifier') {
              types.push(path.node.id.name)
            }
          },
        })
      }
    },
  })

  return types
}

function generateExports(types) {
  let output = `export * from './contracts'

import type { ITypes as PTypes } from './contracts/ProtocolFetcherProxy';
import type { ITypes as TTypes } from './contracts/Router';

// Auto-generated exports
export namespace ITypes {
`

  output += '  // Re-export all types from PTypes\n'
  types.ProtocolFetcherProxy.forEach((type) => {
    output += `  export type ${type} = PTypes.${type};\n`
  })

  output += '\n  // Re-export all types from TTypes\n'
  types.Router.forEach((type) => {
    output += `  export type ${type} = TTypes.${type};\n`
  })

  output += '}\n'
  return output
}

function main() {
  const types = {
    ProtocolFetcherProxy: extractTypesFromFile(path.join(CONTRACTS_DIR, 'ProtocolFetcherProxy.ts')),
    Router: extractTypesFromFile(path.join(CONTRACTS_DIR, 'Router.ts')),
  }

  const output = generateExports(types)
  fs.writeFileSync(OUTPUT_FILE, output)
  console.log('Types have been generated successfully!')
}

main()
