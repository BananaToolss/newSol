import { useState } from 'react'
import { Input, Switch, Segmented, Button, notification } from 'antd'
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  ACCOUNT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeAccountInstruction,
  MintLayout
} from '@solana/spl-token'
import { Input_Style, Button_Style, OPENBOOK_PROGRAM_ID, MARKET_FEE, BANANATOOLS_ADDRESS } from '@/config'
import { Page } from '@/styles'
import { SOL, PUMP } from '@/config/Token'
import type { Token_Type } from '@/type'
import { Header, SelectToken } from '@/components'
import { CreatePool } from './style'

function CreateLiquidity() {
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();

  const [baseToken, setBaseToken] = useState<Token_Type>(SOL)
  const [token, setToken] = useState<Token_Type>(PUMP)
  const baseChange = (_token: Token_Type) => {
    setBaseToken(_token)
  }
  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }

  return (
    <Page>
      <Header title='创建流动性池' hint='轻松创建任何 Solana 代币的流动资金池。您的代币将可在 Raydium、Birdeye 和 DexScreener 上进行交易。' />
      <CreatePool>
        <div className='token'>
          <div className='tokenItem mr-5'>
            <div className='mb-1 start'>基础代币</div>
            <SelectToken selecToken={baseToken} callBack={baseChange} />
          </div>
          <div className='tokenItem'>
            <div className='mb-1 start'>报价代币</div>
            <SelectToken selecToken={token} callBack={backClick} />
          </div>
        </div>
      </CreatePool>

    </Page>
  )
}

export default CreateLiquidity