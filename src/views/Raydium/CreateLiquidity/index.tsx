import { useState, useEffect } from 'react'
import { Input, Switch, DatePicker, Button, notification, Segmented } from 'antd'
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Page } from '@/styles'
import { SOL, PUMP } from '@/config/Token'
import type { Token_Type } from '@/type'
import { Header, SelectToken, Result, Hint } from '@/components'
import AMM from './AMM'
import CPMM from './CPMM'
import CLMM from './CLMM'

const SGECONFIG = [
  { label: 'AMM OpenBook ID', value: 1 },
  { label: 'CPMM', value: 2 },
  // { label: 'CLMM-稳定池', value: 3 },
]


function CreateLiquidity() {
  const [api, contextHolder1] = notification.useNotification();
  const [pooltype, setPoolType] = useState(1)
  const [isCreateAndBuy, setIsCreateAndBuy] = useState(false)

  useEffect(() => {
    if (window.location.hash && window.location.hash === '#/raydium/createLiquidityandbuy') {
      setIsCreateAndBuy(true)
    } else {
      setIsCreateAndBuy(false)
    }
  }, [window.location.hash])

  const pooltypeChange = (e) => {
    setPoolType(e)
  }


  return (
    <Page>
      {contextHolder1}
      <Header title='创建流动性池' hint='轻松创建任何 Solana 代币的流动资金池。您的代币将可在 Raydium、Birdeye 和 DexScreener 上进行交易。' />
      <div className='mb-5'>
        <Segmented options={SGECONFIG} size='large' value={pooltype} onChange={pooltypeChange} />
      </div>

      {pooltype === 1 && <AMM isAndBuy={isCreateAndBuy} />}
      {pooltype === 2 && <CPMM />}
      {pooltype === 3 && <CLMM />}

    </Page>
  )
}

export default CreateLiquidity