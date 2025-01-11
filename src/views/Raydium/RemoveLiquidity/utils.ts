import {
  AMM_V4, AMM_STABLE, DEVNET_PROGRAM_ID,
  CREATE_CPMM_POOL_PROGRAM, DEV_CREATE_CPMM_POOL_PROGRAM
} from '@raydium-io/raydium-sdk-v2'

const VALID_PROGRAM_ID = new Set([
  AMM_V4.toBase58(),
  AMM_STABLE.toBase58(),
  DEVNET_PROGRAM_ID.AmmV4.toBase58(),
  DEVNET_PROGRAM_ID.AmmStable.toBase58(),
])

export const isValidAmm = (id: string) => VALID_PROGRAM_ID.has(id)


const VALID_PROGRAM_ID1 = new Set([CREATE_CPMM_POOL_PROGRAM.toBase58(), DEV_CREATE_CPMM_POOL_PROGRAM.toBase58()])

export const isValidCpmm = (id: string) => VALID_PROGRAM_ID1.has(id)