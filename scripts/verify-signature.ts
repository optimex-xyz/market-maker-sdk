#!/usr/bin/env ts-node
import * as fs from 'fs'
import * as path from 'path'
import { getMakePaymentHash, sdk, signerService } from '../src/index'

import { ethers } from 'ethers'

// Set SDK environment (staging by default, can be overridden via ENV environment variable)
sdk.setEnvironment('staging')

interface VerifySignatureParams {
  rpcUrl: string
  signature: string
  tradeId: string
  paymentTxHash: string
  signedAt: number
  expectedSignerAddress: string
}

interface VerifySignatureConfig {
  rpcUrl: string
  signature: string
  tradeId: string
  paymentTxHash: string
  signedAt: number
  expectedSignerAddress: string
}

async function verifySignature(params: VerifySignatureParams) {
  const { rpcUrl, signature, tradeId, paymentTxHash, signedAt, expectedSignerAddress } = params

  console.log('='.repeat(80))
  console.log('Settlement Signature Verification')
  console.log('='.repeat(80))
  console.log()
  console.log('Input Parameters:')
  console.log(`  RPC URL: ${rpcUrl}`)
  console.log(`  Trade ID: ${tradeId}`)
  console.log(`  Payment TX Hash: ${paymentTxHash}`)
  console.log(`  Signed At: ${signedAt} (${new Date(signedAt * 1000).toISOString()})`)
  console.log(`  Signature: ${signature.slice(0, 20)}...${signature.slice(-20)}`)
  console.log()

  try {
    // Prepare trade data (same as signing)
    const tradeIds: string[] = [tradeId]
    const startIdx = BigInt(tradeIds.indexOf(tradeId))

    console.log('Transaction Details:')
    console.log(`  Start Index: ${startIdx}`)
    console.log()

    // Use expected signer address from config (wallet address from private key)
    console.log('Expected Signer Address:')
    console.log(`  ${expectedSignerAddress}`)
    console.log()

    // Generate payment hash (same as signing)
    console.log('Generating payment hash...')
    const makePaymentInfoHash = getMakePaymentHash(tradeIds, BigInt(signedAt), startIdx, paymentTxHash)
    console.log(`  Payment Hash: ${makePaymentInfoHash}`)
    console.log()

    // Get domain for verification
    console.log('Fetching domain information...')
    const domain = await signerService.getDomain()
    console.log('  Domain Details:')
    console.log(JSON.stringify(domain, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 4))
    console.log()

    // Create TypedData for EIP-712 signature verification
    // MakePayment type only contains infoHash field
    const types = {
      MakePayment: [{ name: 'infoHash', type: 'bytes32' }],
    }

    const value = {
      infoHash: makePaymentInfoHash,
    }

    // Recover address from signature
    console.log('Recovering signer address from signature...')
    const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature)
    console.log(`  Recovered Address: ${recoveredAddress}`)
    console.log()

    // Verify if recovered address matches expected signer address (from private key)
    const isValid = recoveredAddress.toLowerCase() === expectedSignerAddress.toLowerCase()

    console.log('='.repeat(80))
    console.log('Verification Result')
    console.log('='.repeat(80))
    console.log()
    console.log(`  Recovered Address:        ${recoveredAddress}`)
    console.log(`  Expected Signer Address:  ${expectedSignerAddress}`)
    console.log(`  Signature Valid:          ${isValid ? '✓ YES' : '✗ NO'}`)
    console.log()

    if (isValid) {
      console.log('✓ Success: The signature is valid and signed by the expected signer.')
      console.log('  This signature can be submitted to the solver service.')
    } else {
      console.log('✗ Error: The signature is INVALID!')
      console.log('  The recovered address does not match the expected signer.')
      console.log('  This signature will be REJECTED by the solver service.')
      console.log()
      console.log('Possible causes:')
      console.log('  1. Wrong private key used for signing')
      console.log('  2. The recovered address needs to be registered as the authorized signer')
      console.log(`  3. Contact the router service to authorize: ${recoveredAddress}`)
    }
    console.log()

    return {
      recoveredAddress,
      expectedSignerAddress,
      isValid,
      domain,
      makePaymentInfoHash,
    }
  } catch (error) {
    console.error()
    console.error('='.repeat(80))
    console.error('Error verifying signature:')
    console.error('='.repeat(80))
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`)
      console.error(`  Stack: ${error.stack}`)
    } else {
      console.error(`  ${error}`)
    }
    throw error
  }
}

// Main execution
async function main() {
  const configPath = path.join(process.cwd(), 'scripts', 'verify-signature-config.json')

  console.log('Reading configuration from:', configPath)
  console.log()

  // Check if config file exists
  if (!fs.existsSync(configPath)) {
    console.error('Error: Configuration file not found!')
    console.error(`Expected location: ${configPath}`)
    console.error()
    console.error('Please create the config file with the following structure:')
    console.error(
      JSON.stringify(
        {
          rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
          signature: '0xSIGNATURE_FROM_SIGN_SETTLEMENT',
          tradeId: '0xTRADE_ID_HERE',
          paymentTxHash: '0xPAYMENT_TX_HASH_HERE',
          signedAt: 1234567890,
          expectedSignerAddress: '0xEXPECTED_WALLET_ADDRESS',
        },
        null,
        2
      )
    )
    console.error()
    console.error('Note: Use the same values and signature from yarn sign-settlement output')
    process.exit(1)
  }

  try {
    // Read and parse config file
    const configContent = fs.readFileSync(configPath, 'utf-8')
    const config: VerifySignatureConfig = JSON.parse(configContent)

    // Validate required fields
    const requiredFields: (keyof VerifySignatureConfig)[] = [
      'rpcUrl',
      'signature',
      'tradeId',
      'paymentTxHash',
      'signedAt',
      'expectedSignerAddress',
    ]
    const missingFields = requiredFields.filter((field) => {
      if (!config[field]) return true
      if (typeof config[field] === 'string' && (config[field] as string).includes('YOUR_')) return true
      if (typeof config[field] === 'string' && (config[field] as string).includes('SIGNATURE_FROM')) return true
      return false
    })

    if (missingFields.length > 0) {
      console.error('Error: Please fill in all required fields in the config file:')
      missingFields.forEach((field) => {
        console.error(`  - ${field}`)
      })
      process.exit(1)
    }

    const result = await verifySignature({
      rpcUrl: config.rpcUrl,
      signature: config.signature,
      tradeId: config.tradeId,
      paymentTxHash: config.paymentTxHash,
      signedAt: config.signedAt,
      expectedSignerAddress: config.expectedSignerAddress,
    })

    if (!result.isValid) {
      process.exit(1)
    }

    process.exit(0)
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('Error: Invalid JSON in config file')
      console.error(error.message)
    } else {
      console.error('Script failed')
    }
    process.exit(1)
  }
}

// Run if executed directly
main()
