import { useState } from 'react'
import { Api, Raydium, TxVersion, parseTokenAccountResp } from '@raydium-io/raydium-sdk-v2'
import { Radio, Input, Select, Switch, Button } from 'antd'
import type { RadioChangeEvent } from 'antd';
import { AnchorProvider } from "@coral-xyz/anchor";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Header, SelectToken, Segmentd, WalletInfoCollection, JitoFee } from '@/components'
import type { Token_Type, CollocetionType } from '@/type'
import { SOL, PUMP } from '@/config/Token'
import { Input_Style, Button_Style } from '@/config'
import { initSdk } from '@/Dex/Raydium'
import { PumpFunSDK } from "@/Dex/Pump";
import {
  SwapBotPage,
  LeftPage,
  RightPage,
  Card
} from './style'
import { Keypair, PublicKey } from '@solana/web3.js';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { delay } from './utils';
import { ethers } from 'ethers';




function SwapBot() {
  const { connection } = useConnection();
  const wallet = useWallet()
  const [baseToken, setBseToken] = useState<Token_Type>(SOL)
  const [token, setToken] = useState<Token_Type>(PUMP)
  const [dexCount, setDexCount] = useState(2) // 1raydium 2pump
  const [walletConfig, setWalletConfig] = useState<CollocetionType[]>([]) //钱包信息


  const [isJito, setIsJito] = useState(false)
  const [jitoBindNum, setJitoBindNum] = useState(2)
  const [jitoFee, setJitoFee] = useState<number>(0)
  const [jitoRpc, setJitoRpc] = useState('')

  const [config, setConfig] = useState({
    modeType: 1, //模式 1拉盘 2砸盘 3刷量
    thread: '1', //线程数
    spaceTime: '1', //间隔时间
    slippage: '1', //滑点
    amountType: 1, //1固定 2百分比 3随机
    minAmount: '',
    maxAmount: ''
  })
  const configChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }
  const modeTypeChange = (e: RadioChangeEvent) => {
    setConfig({ ...config, modeType: Number(e.target.value) })
  }
  const amountTypeChange = (e: RadioChangeEvent) => {
    setConfig({ ...config, amountType: Number(e.target.value) })
  }
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

  const startClick = async () => {
    try {
      const _walletConfig = [...walletConfig]
      const raydiums: Raydium[] = []

      if (dexCount === 1) {
        console.log('钱包准备中')
        for (let i = 0; i < _walletConfig.length; i++) {
          const account = Keypair.fromSecretKey(bs58.decode(_walletConfig[i].privateKey))
          let raydium: Raydium | null
          try {
            raydium = await initSdk({ owner: account, connection: connection })
          } catch (error) {
            console.log(`钱包${i + 1}加载失败`)
          }
          if (raydium) raydiums.push(raydium)
          await delay(140)
        }
        console.log(`钱包准备就绪`)
      }
      if (dexCount === 2) {
        pumpFun()
      }
    } catch (error) {
      console.log(error)
    }
  }

  const pumpFun = async () => {
    try {
      const _walletConfig = [...walletConfig]
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "finalized",
      });
      let sdk: PumpFunSDK = new PumpFunSDK(provider);
      const QueteToken = new PublicKey(token.address)

      const tokenPool = await sdk.getBondingCurveAccount(QueteToken)
      const capSOL = tokenPool.getMarketCapSOL()
      const price = ethers.utils.formatEther(capSOL)

      const walletIndex = 0
      const account = Keypair.fromSecretKey(bs58.decode(_walletConfig[walletIndex].privateKey))

      const buyTx = await sdk.buy(account, QueteToken, 1000000n, 500n)
      
    } catch (error) {
      console.log(error)
    }
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
                  value={config.thread} onChange={configChange} name='thread' />
              </div>
              <div className='flex-1'>
                <div>任务执行间隔(秒)</div>
                <Input type='number' className={Input_Style}
                  value={config.spaceTime} onChange={configChange} name='spaceTime' />
              </div>
            </div>
            <div className='flex items-center mt-4'>
              <div className='mr-3'>滑点(%)</div>
              <div>
                <Input value={config.slippage} onChange={configChange} name='slippage' />
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

          <div className='box mt-3'>
            <div className='header'>机器人管理</div>

            <div className='flex mt-5'>
              <div className='font-semibold'>模式：</div>
              <Radio.Group onChange={modeTypeChange} value={config.modeType}>
                <Radio value={1}>拉盘</Radio>
                <Radio value={2}>砸盘</Radio>
                <Radio value={3}>防夹刷量</Radio>
              </Radio.Group>
            </div>

            <div className='mt-5 flex items-center'>
              <div className='font-semibold'>{config.modeType == 2 ? '数量' : '金额'}： </div>
              <Radio.Group onChange={amountTypeChange} value={config.amountType}>
                <Radio value={1}>固定</Radio>
                <Radio value={2}>百分比</Radio>
                <Radio value={3}>随机</Radio>
              </Radio.Group>
              <div className='flex items-center'>
                <div className='w-32'>
                  <Input value={config.minAmount} onChange={configChange} name='minAmount' />
                </div>
                {config.amountType === 3 &&
                  <>
                    <div className='mx-2 font-bold'>~</div>
                    <div className='w-32'>
                      <Input value={config.maxAmount} onChange={configChange} name='maxAmount' />
                    </div>
                  </>
                }
              </div>
            </div>
          </div>

          <div className='btn mt-5'>
            <div className='buttonSwapper mt-4'>
              <Button className={Button_Style} onClick={startClick}>开始执行</Button>
            </div>
            <div className='fee'>全网最低服务费0.002SOL每笔交易</div>
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