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
  decimals: 9,
  image: getImage('usdc.png'),
  balance: ''
}

export const USDT: Token_Type = {
  address: USDT_TOKEN,
  name: 'USDT',
  symbol: 'USDT',
  decimals: 9,
  image: getImage('usdt.svg'),
  balance: ''
}

export const PUMP: Token_Type = {
  address: '6Rzy39yQvjp2ZFtMQby4jvzBWDFy4vXhhV33fvQJFHpL',
  name: 'PUMP',
  symbol: 'PUMP',
  decimals: 9,
  image: getImage('pump.svg'),
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