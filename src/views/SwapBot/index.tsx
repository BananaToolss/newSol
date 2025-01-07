import React from 'react'
import { Header } from '@/components'
import {
  SwapBotPage,
  LeftPage,
  RightPage
} from './style'

function SwapBot() {
  return (
    <SwapBotPage>
      <Header title='市值管理' hint='预设并自动执行交易指令，轻松实现批量在DEX交易，提高了交易的效率和时效性，特别适用于快速执行大量交易的场景' />
      <LeftPage>

      </LeftPage>
      <RightPage>
        
      </RightPage>
    </SwapBotPage>
  )
}

export default SwapBot