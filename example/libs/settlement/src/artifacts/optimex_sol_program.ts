import * as anchor from '@coral-xyz/anchor'
import { clusterApiUrl, Connection } from '@solana/web3.js'

import { OptimexSolSmartcontract } from './optimex_sol_smartcontract'
import IDL from './optimex_sol_smartcontract.json'

const provider = new anchor.AnchorProvider(new Connection(clusterApiUrl('devnet')), {} as any, {
  commitment: 'confirmed',
})
const optimexSolProgram = new anchor.Program(
  IDL as OptimexSolSmartcontract,
  provider
) as anchor.Program<OptimexSolSmartcontract>

export { optimexSolProgram }
