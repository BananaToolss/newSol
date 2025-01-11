import { useEffect, useState } from 'react'
import { Button, notification, Segmented, Input, Flex, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js'
import {
  TxVersion,
  AmmV4Keys,
  AmmV5Keys,
  ApiV3PoolInfoStandardItem,
} from '@raydium-io/raydium-sdk-v2'
import BN from 'bn.js'
import Decimal from 'decimal.js'
import { getMint } from '@solana/spl-token';
import { PoolFetchType, } from "@raydium-io/raydium-sdk-v2";
import { initSdk, RaydiumApi } from '@/Dex/Raydium'
import { Input_Style, Button_Style, REMOVE_POOL_FEE, BANANATOOLS_ADDRESS, isMainnet } from '@/config'
import { Page } from '@/styles'
import { getAsset } from '@/utils/sol'
import { getAt } from '@/utils/getAta'
import { getTxLink, addPriorityFees, getImage } from '@/utils'
import { SOL, PUMP } from '@/config/Token'
import type { Token_Type } from '@/type'
import { Header, SelectToken, Result } from '@/components'
import { isValidAmm } from './utils'
import queryLpByToken from './getAllPool'
import { CreatePool } from './style'
import { getSPLBalance } from '@/utils/util';
import AMM from './AMM'
import CPMM from './CPMM'

interface PoolType {
  lpReserve: number
  baseMint: string
  quoteMint: string
  pubkey: string
  marketProgramId: string //交易所
  baseSymbol: string
  baseImage: string
  symbol: string
  image: string
  balance: number
  lpMint: string
}

const SGECONFIG = [
  { label: 'AMM OpenBook ID', value: 1 },
  { label: 'CPMM', value: 2 },
  // { label: 'CLMM-稳定池', value: 3 },
]

function CreateLiquidity() {
  const [api, contextHolder1] = notification.useNotification();

  const [pooltype, setPoolType] = useState(1)

  const pooltypeChange = (e) => {
    setPoolType(e)
  }

  return (
    <Page>
      {contextHolder1}
      <Header title='移除流动性' hint='移除当前代币的AMM流动性,并收回流动性池内所有的报价代币(SOL),移除流动性后代币将无法交易,流动性池内的资金会自动回流到创建者钱包' />
      <div className='mb-5'>
        <Segmented options={SGECONFIG} size='large' value={pooltype} onChange={pooltypeChange} />
      </div>

      {pooltype === 1 && <AMM />}
      {pooltype === 2 && <CPMM />}
    </Page>
  )
}

export default CreateLiquidity