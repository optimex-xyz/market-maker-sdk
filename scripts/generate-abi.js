#!/usr/bin/env node

/**
 * Script to generate TypeScript ABI files and contract types from JSON ABI files.
 * Reads from ./abi/*.json and writes to:
 *   - ./src/abi/*.ts (ABI definitions)
 *   - ./src/types/contract/*.ts (contract types per ABI)
 * Each ABI is exported with `as const` for viem type inference.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const fs = require('fs')
const path = require('path')

const ABI_INPUT_DIR = path.join(__dirname, '..', 'abi')
const ABI_OUTPUT_DIR = path.join(__dirname, '..', 'src', 'abi')
const CONTRACT_TYPES_DIR = path.join(__dirname, '..', 'src', 'types', 'contract')

/**
 * Whitelist of ABIs to generate contract types from
 * Only these ABIs will have types extracted
 */
const ABI_WHITELIST = ['ProtocolFetcherProxy', 'Router']

/**
 * Convert name to camelCase for variable names
 * Handles special cases like ERC20 -> erc20
 */
function toCamelCase(str) {
  const match = str.match(/^([A-Z]+)(\d.*|$)/)
  if (match) {
    return str.toLowerCase()
  }
  return str.charAt(0).toLowerCase() + str.slice(1)
}

/**
 * Convert PascalCase to kebab-case
 * e.g., ProtocolFetcherProxy -> protocol-fetcher-proxy
 */
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * Check if an ABI item returns a struct (has named outputs or nested components)
 */
function returnsStruct(item) {
  if (!item.outputs || item.outputs.length === 0) return false

  // Check if any output has components (struct) or multiple named outputs
  return item.outputs.some((output) => {
    // Has components = struct
    if (output.components && output.components.length > 0) return true
    // Tuple type = struct
    if (output.type.startsWith('tuple')) return true
    return false
  })
}

/**
 * Check if function returns an array of structs
 */
function returnsArray(item) {
  if (!item.outputs || item.outputs.length === 0) return false
  return item.outputs.some((output) => output.type.endsWith('[]'))
}

/**
 * Convert function name to type name
 * e.g., getPMMSelection -> PMMSelectionStructOutput
 *       getLatestMPCInfo -> MPCInfoStructOutput (remove 'Latest')
 *       getSettlementPresigns -> SettlementPresignStructOutput (singularize for arrays)
 */
function functionToTypeName(funcName, isArray) {
  let name = funcName
  // Remove 'get' prefix
  if (name.startsWith('get')) {
    name = name.slice(3)
  }
  // Remove common prefixes like 'Latest'
  if (name.startsWith('Latest')) {
    name = name.slice(6)
  }
  // Singularize for array types (remove trailing 's')
  if (isArray && name.endsWith('s')) {
    name = name.slice(0, -1)
  }
  return `${name}StructOutput`
}

/**
 * Extract nested struct property names from ABI output components
 */
function extractNestedStructs(item) {
  const nested = []
  if (!item.outputs || item.outputs.length === 0) return nested

  for (const output of item.outputs) {
    if (output.components) {
      for (const comp of output.components) {
        // If component is a tuple (struct), it can be extracted as nested type
        if (comp.type.startsWith('tuple') && comp.name) {
          nested.push(comp.name)
        }
      }
    }
  }
  return nested
}

/**
 * Analyze ABI and extract type definitions
 */
function analyzeAbi(abiName, abiJson) {
  const types = []
  const nestedTypes = []

  for (const item of abiJson) {
    // Only process view/pure functions that return structs
    if (
      item.type === 'function' &&
      (item.stateMutability === 'view' || item.stateMutability === 'pure') &&
      returnsStruct(item)
    ) {
      const isArray = returnsArray(item)
      const typeName = functionToTypeName(item.name, isArray)

      types.push({
        funcName: item.name,
        typeName,
        isArray,
        abiName,
      })

      // Extract nested structs
      const nested = extractNestedStructs(item)
      for (const propName of nested) {
        const nestedTypeName = `${propName.charAt(0).toUpperCase()}${propName.slice(1)}StructOutput`
        nestedTypes.push({
          typeName: nestedTypeName,
          parentType: typeName,
          property: propName,
        })
      }
    }
  }

  return { types, nestedTypes }
}

/**
 * Generate TypeScript file content for an ABI
 */
function generateAbiTs(name, abiJson) {
  const camelName = toCamelCase(name)
  const abiContent = JSON.stringify(abiJson, null, 2)

  return `/**
 * ${name} ABI - Auto-generated from abi/${name}.json
 * DO NOT EDIT MANUALLY - Run \`yarn generate:abi\` to regenerate
 */

export const ${camelName}Abi = ${abiContent} as const;

export type ${name}Abi = typeof ${camelName}Abi;
`
}

/**
 * Generate index.ts that exports all ABIs
 */
function generateAbiIndexTs(abiNames) {
  const exports = abiNames.map((name) => `export * from './${name}';`).join('\n')

  return `/**
 * ABI Exports - Auto-generated
 * DO NOT EDIT MANUALLY - Run \`yarn generate:abi\` to regenerate
 */

${exports}
`
}

/**
 * Generate individual contract type file for a single ABI
 */
function generateContractTypeFile(abiName, types, nestedTypes) {
  const lines = []
  const camelAbiName = toCamelCase(abiName)
  const kebabName = toKebabCase(abiName)

  // Header
  lines.push(`/**`)
  lines.push(` * ${abiName} Contract Types - Auto-generated using viem`)
  lines.push(` * DO NOT EDIT MANUALLY - Run \`yarn generate:abi\` to regenerate`)
  lines.push(` */`)
  lines.push(``)

  // Imports
  lines.push(`import type { ContractFunctionReturnType } from 'viem'`)
  lines.push(``)
  lines.push(`import type { ${camelAbiName}Abi } from '../../abi'`)
  lines.push(``)

  // Generate types (deduplicated by type name)
  const seenTypes = new Set()
  for (const t of types) {
    if (seenTypes.has(t.typeName)) continue
    seenTypes.add(t.typeName)

    if (t.isArray) {
      lines.push(`export type ${t.typeName} = ContractFunctionReturnType<`)
      lines.push(`  typeof ${camelAbiName}Abi,`)
      lines.push(`  'view',`)
      lines.push(`  '${t.funcName}'`)
      lines.push(`>[number]`)
    } else {
      lines.push(`export type ${t.typeName} = ContractFunctionReturnType<`)
      lines.push(`  typeof ${camelAbiName}Abi,`)
      lines.push(`  'view',`)
      lines.push(`  '${t.funcName}'`)
      lines.push(`>`)
    }
  }

  // Generate nested types (deduplicated)
  if (nestedTypes.length > 0) {
    lines.push(``)
    lines.push(`// Nested types extracted from parent structs`)

    const seen = new Set()
    for (const t of nestedTypes) {
      if (!seen.has(t.typeName)) {
        seen.add(t.typeName)
        lines.push(`export type ${t.typeName} = ${t.parentType}['${t.property}']`)
      }
    }
  }

  lines.push(``)
  return { content: lines.join('\n'), fileName: `${kebabName}.ts` }
}

/**
 * Generate index.ts for contract types folder
 */
function generateContractTypesIndexTs(abiNames) {
  const exports = abiNames.map((name) => `export * from './${toKebabCase(name)}';`).join('\n')

  return `/**
 * Contract Types Exports - Auto-generated
 * DO NOT EDIT MANUALLY - Run \`yarn generate:abi\` to regenerate
 */

${exports}
`
}

function main() {
  // Ensure output directories exist
  if (!fs.existsSync(ABI_OUTPUT_DIR)) {
    fs.mkdirSync(ABI_OUTPUT_DIR, { recursive: true })
  }
  if (!fs.existsSync(CONTRACT_TYPES_DIR)) {
    fs.mkdirSync(CONTRACT_TYPES_DIR, { recursive: true })
  }

  // Get all JSON files in abi directory
  const abiFiles = fs.readdirSync(ABI_INPUT_DIR).filter((file) => file.endsWith('.json'))

  if (abiFiles.length === 0) {
    console.log('No ABI files found in', ABI_INPUT_DIR)
    return
  }

  const abiNames = []
  const whitelistedAbis = []

  // Process each ABI file
  for (const file of abiFiles) {
    const name = path.basename(file, '.json')
    const inputPath = path.join(ABI_INPUT_DIR, file)
    const outputPath = path.join(ABI_OUTPUT_DIR, `${name}.ts`)

    // Read JSON ABI
    const abiJson = JSON.parse(fs.readFileSync(inputPath, 'utf8'))

    // Generate TypeScript content
    const tsContent = generateAbiTs(name, abiJson)

    // Write TypeScript file
    fs.writeFileSync(outputPath, tsContent, 'utf8')
    console.log(`Generated: src/abi/${name}.ts`)

    abiNames.push(name)

    // Analyze ABI for types if in whitelist
    if (ABI_WHITELIST.includes(name)) {
      const { types, nestedTypes } = analyzeAbi(name, abiJson)

      if (types.length > 0) {
        const { content, fileName } = generateContractTypeFile(name, types, nestedTypes)
        const typesPath = path.join(CONTRACT_TYPES_DIR, fileName)
        fs.writeFileSync(typesPath, content, 'utf8')
        console.log(`Generated: src/types/contract/${fileName}`)
        console.log(`  -> Extracted ${types.length} types, ${nestedTypes.length} nested types`)
        whitelistedAbis.push(name)
      }
    }
  }

  // Generate ABI index.ts
  const abiIndexPath = path.join(ABI_OUTPUT_DIR, 'index.ts')
  fs.writeFileSync(abiIndexPath, generateAbiIndexTs(abiNames), 'utf8')
  console.log(`Generated: src/abi/index.ts`)

  // Generate contract types index.ts
  if (whitelistedAbis.length > 0) {
    const typesIndexPath = path.join(CONTRACT_TYPES_DIR, 'index.ts')
    fs.writeFileSync(typesIndexPath, generateContractTypesIndexTs(whitelistedAbis), 'utf8')
    console.log(`Generated: src/types/contract/index.ts`)
  }

  console.log(`\nSuccessfully generated ${abiNames.length} ABI files and ${whitelistedAbis.length} contract type files.`)
}

main()
