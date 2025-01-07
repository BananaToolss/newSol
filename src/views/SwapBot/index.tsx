import { useState } from 'react'
import {
  Header, SelectToken, Segmentd,
  WalletInfoCollection, JitoFee
} from '@/components'
import type { Token_Type, CollocetionType } from '@/type'
import { SOL, USDC } from '@/config/Token'
import { Input_Style } from '@/config'
import {
  SwapBotPage,
  LeftPage,
  RightPage
} from './style'
import { Input, Select, Switch } from 'antd'



function SwapBot() {

  const [baseToken, setBseToken] = useState<Token_Type>(SOL)
  const [token, setToken] = useState<Token_Type>(USDC)
  const [dexCount, setDexCount] = useState(1) // 1raydium 2pump
  const [walletConfig, setWalletConfig] = useState<CollocetionType[]>([]) //钱包信息
  const [thread, setThread] = useState(1)
  const [spaceTime, setSpaceTime] = useState(1)
  const [slippage, setSlippage] = useState(3)
  const [isJito, setIsJito] = useState(false)
  const [jitoBindNum, setJitoBindNum] = useState(1)
  const [jitoFee, setJitoFee] = useState<number>(0)
  const [jitoRpc, setJitoRpc] = useState('')

  const baseTokenClick = (_token: Token_Type) => {
    setBseToken(_token)
  }
  const tokenClick = (_token: Token_Type) => {
    setToken(_token)
  }


  const jitoCallBack = (jitoFee_: number, jitoRpc_: string) => {
    setJitoFee(jitoFee_)
    setJitoRpc(jitoRpc_)
  }

  const options = [
    { value: '1', label: '不捆绑' },
    { value: '2', label: '捆绑2个地址' },
    { value: '3', label: '捆绑3个地址' },
    { value: '4', label: '捆绑4个地址' },
  ]
  const optionsChange = (value: string) => {
    setJitoBindNum(Number(value))
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

          <div className='box mt-3'>
            <div className='header'>通用设置</div>
            <div className='flex justify-between mt-4'>
              <div className='flex-1 mr-4'>
                <div>多线程(多笔交易同时进行)</div>
                <Input type='number' className={Input_Style}
                  value={thread} onChange={(e) => setThread(Number(e.target.value))} />
              </div>
              <div className='flex-1'>
                <div>任务执行间隔(秒)</div>
                <Input type='number' className={Input_Style}
                  value={spaceTime} onChange={(e) => setSpaceTime(Number(e.target.value))} />
              </div>
            </div>
            <div className='flex items-center mt-4'>
              <div className='mr-3'>滑点(%)</div>
              <div>
                <Input value={slippage} onChange={(e) => setSlippage(Number(e.target.value))} />
              </div>
            </div>
            <div className='flex mt-5'>
              <div className='mr-2'>jito MEV模式</div>
              <Switch checked={isJito} onChange={(e) => setIsJito(e)} />
            </div>
            {isJito &&
              <div className='mt-3'>
                <div className='flex items-center mb-4'>
                  <div className='mr-3'>捆绑数量</div>
                  <Select options={options} onChange={optionsChange}
                    style={{ minWidth: '140px' }} value={`${jitoBindNum}`} />
                </div>
                <JitoFee callBack={jitoCallBack} />
              </div>
            }
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