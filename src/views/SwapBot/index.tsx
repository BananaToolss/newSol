import { useState } from 'react'
import { Header, SelectToken, Segmentd, WalletInfoCollection } from '@/components'
import type { Token_Type, CollocetionType } from '@/type'
import { SOL, USDC } from '@/config/Token'
import {
  SwapBotPage,
  LeftPage,
  RightPage
} from './style'

function SwapBot() {

  const [baseToken, setBseToken] = useState<Token_Type>(SOL)
  const [token, setToken] = useState<Token_Type>(USDC)
  const [dexCount, setDexCount] = useState(1) // 1raydium 2pump
  const [walletConfig, setWalletConfig] = useState<CollocetionType[]>([]) //钱包信息

  const baseTokenClick = (_token: Token_Type) => {
    setBseToken(_token)
  }
  const tokenClick = (_token: Token_Type) => {
    setToken(_token)
  }

  return (
    <SwapBotPage>
      <Header title='市值管理' hint='预设并自动执行交易指令，轻松实现批量在DEX交易，提高了交易的效率和时效性，特别适用于快速执行大量交易的场景' />

      <div className='swap'>
        <LeftPage>
          <div className='box'>
            <div className='header'>账号概览</div>
            <div className='flex justify-between mt-4'>
              <div className='box1 mr-4'>
                <div className='box1_header mb-3'>所有账户数量</div>
                <div>
                  <div className='mb-1'>SOL余额：0</div>
                  <div className='mb-1'>USDC余额：0</div>
                  <div className='mb-1'>Token余额：0</div>
                </div>
              </div>
              <div className='box1'>
                <div className='box1_header mb-3'>启用账户数量</div>
                <div>
                  <div className='mb-1'>SOL余额：0</div>
                  <div className='mb-1'>USDC余额：0</div>
                  <div className='mb-1'>Token余额：0</div>
                </div>
              </div>
            </div>
          </div>

          <div className='box mt-3'>
            <div className='header'>
              <div>兑换设置</div>
              <Segmentd count={dexCount} setCount={setDexCount} />
            </div>
            <div className='flex justify-between mt-4'>
              <div className='flex-1 mr-4'>
                <div>价值代币</div>
                <SelectToken selecToken={baseToken} callBack={baseTokenClick} isBot />
              </div>
              <div className='flex-1'>
                <div>做市代币</div>
                <SelectToken selecToken={token} callBack={tokenClick} isBot />
              </div>
            </div>
          </div>

        </LeftPage>
        <RightPage>
          <WalletInfoCollection tokenAddr={token ? token.address : null} config={walletConfig} setConfig={setWalletConfig} isBot />
          <div className='logs'>
             <div className='header'>交易日志</div>
          </div>
        </RightPage>
      </div>
    </SwapBotPage>
  )
}

export default SwapBot