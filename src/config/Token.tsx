import { getImage, IsAddress, addressHandler, fetcher } from '@/utils'
import type { Token_Type } from '@/type'

export const SOL_TOKEN = "So11111111111111111111111111111111111111112";
export const USDC_TOKEN = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
export const USDT_TOKEN = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'


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
  decimals: 6,
  image: getImage('usdc.png'),
  balance: ''
}

export const USDT: Token_Type = {
  address: USDT_TOKEN,
  name: 'USDT',
  symbol: 'USDT',
  decimals: 6,
  image: getImage('usdt.svg'),
  balance: ''
}

export const PUMP: Token_Type = {
  address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  name: 'RAY',
  symbol: 'RAY',
  decimals: 9,
  image: getImage('ray.png'),
  balance: ''
}

export const RAYAMM: Token_Type = {
  address: 'HB9aBU1BbjUJUSp6CqPniF6JevhuPuEEx6xwgjshEeS2',
  name: 'RAYAMM',
  symbol: 'RAYAMM',
  decimals: 9,
  image: getImage('raydium.png'),
  balance: ''
}
export const CPMM: Token_Type = {
  address: '6egE8H5cf8Zxsy68HS7NLrBf7UNSBnmokYeNUX6tzfYq',
  name: 'CPMM',
  symbol: 'CPMM',
  decimals: 9,
  image: getImage('banana.png'),
  balance: ''
}