import { useState } from 'react'
import { Input, Switch, DatePicker, Button, notification, Space } from 'antd'
import type { DatePickerProps } from 'antd';
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  ACCOUNT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeAccountInstruction,
  MintLayout
} from '@solana/spl-token'
import {
  MARKET_STATE_LAYOUT_V3,
  AMM_V4,
  OPEN_BOOK_PROGRAM,
  FEE_DESTINATION_ID,
  DEVNET_PROGRAM_ID,
  TxVersion,
  AmmRpcData,
  AmmV4Keys,
  ApiV3PoolInfoStandardItem,
} from '@raydium-io/raydium-sdk-v2'
import BN from 'bn.js'
import { initSdk } from '@/Dex/Raydium'
import { Input_Style, Button_Style, OPENBOOK_PROGRAM_ID, CREATE_POOL_FEE, BANANATOOLS_ADDRESS, isMainnet } from '@/config'
import { Page } from '@/styles'
import { getTxLink, addPriorityFees } from '@/utils'
import { SOL, PUMP } from '@/config/Token'
import type { Token_Type } from '@/type'
import { Header, SelectToken, Result } from '@/components'
import { CreatePool } from './style'

function CreateLiquidity() {
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();

  const [baseToken, setBaseToken] = useState<Token_Type>(SOL)
  const [token, setToken] = useState<Token_Type>(PUMP)
  const [isOptions, setIsOptions] = useState(false)
  const [isCreate, setIsCreate] = useState(false)
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');
  const [poolAddr, setPoolAddr] = useState('')
  const [isSearchId, setIsSearchId] = useState(false)

  const [config, setConfig] = useState({
    marketId: '',
    baseAmount: '',
    quoteAmount: '',
    startTime: ''
  })
  const configChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }
  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }
 

  return (
    <Page>
      {contextHolder1}
      <Header title='创建流动性池' hint='轻松创建任何 Solana 代币的流动资金池。您的代币将可在 Raydium、Birdeye 和 DexScreener 上进行交易。' />
      <CreatePool>

        <Result tokenAddress={poolAddr} signature={signature} error={error} />
      </CreatePool>

    </Page>
  )
}

export default CreateLiquidity