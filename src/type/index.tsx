import { PublicKey,} from "@solana/web3.js";


export interface TOKEN_TYPE {
  name: string
  symbol: string
  decimals: string
  supply: string
  description: string
  website: string
  telegram: string
  twitter: string
  discord: string

  freeze_authority?: string
  mint_authority?: string
  mutable?: boolean
  owner?: string
  metadataUrl?: string
  image?: string
}


export interface Token_Type {
  name: string
  symbol: string
  address: string
  decimals: number
  image: string
  balance: string
  associatedAccount?: string
  isSelect?: boolean
}

export interface WalletConfigType {
  privateKey: string,
  walletAddr: string,
  balance: string,
  buySol: string,
}

export interface CollocetionType {
  isCheck: boolean
  privateKey: string,
  walletAddr: string,
  balance: number,
  tokenBalance: number,
  assiciaAccount: PublicKey,
  state: number // 0 未执行，1 执行成功，2 执行失败
}
