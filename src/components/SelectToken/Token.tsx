import { getImage, IsAddress, addressHandler, fetcher } from '@/utils'

export const SOL_TOKEN = "So11111111111111111111111111111111111111112";
export const USDC_TOKEN = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
export const USDT_TOKEN = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'


export interface Token_Type {
  mint: string
  uri: string
  symbol: string
}

export const SOL: Token_Type = {
  mint: SOL_TOKEN,
  uri: getImage('sol.png'),
  symbol: 'SOL'
}

export const USDC: Token_Type = {
  mint: USDC_TOKEN,
  uri: getImage('usdc.png'),
  symbol: 'USDC'
}

export const USDT: Token_Type = {
  mint: USDT_TOKEN,
  uri: getImage('usdt.svg'),
  symbol: 'USDT'
}