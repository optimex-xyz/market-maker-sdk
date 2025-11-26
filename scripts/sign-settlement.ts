#!/usr/bin/env ts-node
import * as fs from 'fs'
import * as path from 'path'
import {
  getMakePaymentHash,
  getSignature,
  routerService,
  sdk,
  SignatureType,
  signerService,
} from '../src/index'

import { ethers, type BytesLike } from 'ethers'

// Set SDK environment (staging by default, can be overridden via ENV environment variable)
sdk.setEnvironment('staging')

interface SignatureParams {
  rpcUrl: string
  privateKey: string
  pmmId: string
  tradeId: string
  paymentTxHash: string
  signedAt: number
}

interface SignatureConfig {
  rpcUrl: string
  privateKey: string
  pmmId: string
  tradeId: string
  paymentTxHash: string
  signedAt: number
}

async function generateSignature(params: SignatureParams) {
  const { rpcUrl, privateKey, pmmId, tradeId, paymentTxHash, signedAt } = params

  console.log('='.repeat(80))
  console.log('Settlement Signature Generator')
  console.log('='.repeat(80))
  console.log()
  console.log('Input Parameters:')
  console.log(`  RPC URL: ${rpcUrl}`)
  console.log(`  PMM ID: ${pmmId}`)
  console.log(`  Trade ID: ${tradeId}`)
  console.log(`  Payment TX Hash: ${paymentTxHash}`)
  console.log(`  Private Key: ${privateKey.slice(0, 10)}...${privateKey.slice(-10)}`)
  console.log()

  try {
    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const pmmWallet = new ethers.Wallet(privateKey, provider)

    console.log('Wallet Information:')
    console.log(`  Address: ${pmmWallet.address}`)
    console.log()

    // Prepare trade data
    const tradeIds: BytesLike[] = [tradeId]
    const startIdx = BigInt(tradeIds.indexOf(tradeId))

    console.log('Transaction Details:')
    console.log(`  Start Index: ${startIdx}`)
    console.log(`  Signed At: ${signedAt} (${new Date(signedAt * 1000).toISOString()})`)
    console.log()

    // Get signer address from router service
    console.log('Fetching signer address from router service...')
    const signerAddress = await routerService.getSigner()
    console.log(`  Signer Address: ${signerAddress}`)
    console.log()

    // Generate payment hash
    console.log('Generating payment hash...')
    const makePaymentInfoHash = getMakePaymentHash(tradeIds, BigInt(signedAt), startIdx, paymentTxHash)
    console.log(`  Payment Hash: ${makePaymentInfoHash}`)
    console.log()

    // Get domain for signing
    console.log('Fetching domain information...')
    const domain = await signerService.getDomain()
    console.log(`  Domain: ${JSON.stringify(domain, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2)}`)
    console.log()

    // Generate signature
    console.log('Generating signature...')
    const signature = await getSignature(
      pmmWallet,
      provider,
      signerAddress,
      tradeId,
      makePaymentInfoHash,
      SignatureType.MakePayment,
      domain
    )

    console.log()
    console.log('='.repeat(80))
    console.log('Signature Generated Successfully!')
    console.log('='.repeat(80))
    console.log()
    console.log('Output:')
    console.log(`  Signature: ${signature}`)
    console.log()
    console.log('Request Payload (for Solver Service):')
    const requestPayload = {
      tradeIds: [tradeId],
      pmmId: pmmId,
      settlementTx: paymentTxHash,
      signature: signature,
      startIndex: 0,
      signedAt: signedAt,
    }
    console.log(JSON.stringify(requestPayload, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2))
    console.log()

    console.log('='.repeat(80))
    console.log('To Verify This Signature:')
    console.log('='.repeat(80))
    console.log()
    console.log('Copy these values to scripts/verify-signature-config.json:')
    console.log()
    const verifyConfig = {
      rpcUrl: rpcUrl,
      signature: signature,
      tradeId: tradeId,
      paymentTxHash: paymentTxHash,
      signedAt: signedAt,
      expectedSignerAddress: pmmWallet.address,
    }
    console.log(JSON.stringify(verifyConfig, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2))
    console.log()
    console.log('Then run: yarn verify-signature')
    console.log()

    return {
      signature,
      requestPayload,
      signerAddress,
      walletAddress: pmmWallet.address,
      signedAt,
      makePaymentInfoHash,
    }
  } catch (error) {
    console.error()
    console.error('='.repeat(80))
    console.error('Error generating signature:')
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
  const configPath = path.join(process.cwd(), 'scripts', 'sign-settlement-config.json')

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
          privateKey: '0xYOUR_PRIVATE_KEY_HERE',
          pmmId: 'YOUR_PMM_ID_HERE',
          tradeId: '0xTRADE_ID_HERE',
          paymentTxHash: '0xPAYMENT_TX_HASH_HERE',
          signedAt: 1234567890,
        },
        null,
        2
      )
    )
    process.exit(1)
  }

  try {
    // Read and parse config file
    const configContent = fs.readFileSync(configPath, 'utf-8')
    const config: SignatureConfig = JSON.parse(configContent)

    // Validate required fields
    const requiredFields: (keyof SignatureConfig)[] = [
      'rpcUrl',
      'privateKey',
      'pmmId',
      'tradeId',
      'paymentTxHash',
      'signedAt',
    ]
    const missingFields = requiredFields.filter((field) => {
      if (!config[field]) return true
      if (typeof config[field] === 'string' && (config[field] as string).includes('YOUR_')) return true
      return false
    })

    if (missingFields.length > 0) {
      console.error('Error: Please fill in all required fields in the config file:')
      missingFields.forEach((field) => {
        console.error(`  - ${field}`)
      })
      process.exit(1)
    }

    await generateSignature({
      rpcUrl: config.rpcUrl,
      privateKey: config.privateKey,
      pmmId: config.pmmId,
      tradeId: config.tradeId,
      paymentTxHash: config.paymentTxHash,
      signedAt: config.signedAt,
    })
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
