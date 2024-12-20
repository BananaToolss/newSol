import { getImage, IsAddress, addressHandler, fetcher } from '@/utils'

export const SOL_TOKEN = "So11111111111111111111111111111111111111112";
export const USDC_TOKEN = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
export const USDT_TOKEN = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'


export interface Token_Type {
  name: string
  symbol: string
  address: string
  decimals: number
  image: string
  balance: string
}

export const SOL: Token_Type = {
  address: SOL_TOKEN,
  name: 'SOL',
  symbol: 'SOL',
  decimals: 9,
  image: getImage('sol.png'),
  balance: ''
}

export const USDC: Token_Type = {
  address: USDC_TOKEN,
  name: 'USDC',
  symbol: 'USDC',
  decimals: 9,
  image: getImage('usdc.png'),
  balance: ''
}

export const USDT: Token_Type = {
  address: USDT_TOKEN,
  name: 'USDT',
  symbol: 'USDT',
  decimals: 9,
  image: getImage('usdt.png'),
  balance: ''
}