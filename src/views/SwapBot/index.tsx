import { useState, useEffect } from 'react'
import { Api, Raydium, TxVersion, parseTokenAccountResp } from '@raydium-io/raydium-sdk-v2'
import { Radio, Input, Select, Switch, Button, notification } from 'antd'
import type { RadioChangeEvent } from 'antd';
import { Keypair, PublicKey, SystemProgram, Transaction, Commitment, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AnchorProvider } from "@coral-xyz/anchor";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Header, SelectToken, Segmentd, WalletInfoCollection, JitoFee } from '@/components'
import type { Token_Type, CollocetionType } from '@/type'
import { SOL, PUMP } from '@/config/Token'
import { Input_Style, Button_Style } from '@/config'
import { initSdk } from '@/Dex/Raydium'
import { PumpFunSDK } from "@/Dex/Pump";
import { getTxLink, addPriorityFees } from '@/utils'
import {
  SwapBotPage,
  LeftPage,
  RightPage,
  Card
} from './style'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { delay, getRandomNumber, getSPLBalance, getCurrentTimestamp } from './utils';
import { ethers } from 'ethers';

interface LogsType {
  time: string
  label: string
  color?: string
  isLink?: boolean
}
const BASE_NUMBER = 10000
const HASH_COLOR = '#51d38e'

function SwapBot() {
  const { connection } = useConnection();
  const wallet = useWallet()
  const [api, contextHolder1] = notification.useNotification();
  const [baseToken, setBseToken] = useState<Token_Type>(SOL)
  const [token, setToken] = useState<Token_Type>(PUMP)
  const [dexCount, setDexCount] = useState(2) // 1raydium 2pump
  const [walletConfig, setWalletConfig] = useState<CollocetionType[]>([]) //钱包信息


  const [isJito, setIsJito] = useState(false)
  const [jitoBindNum, setJitoBindNum] = useState(2)
  const [jitoFee, setJitoFee] = useState<number>(0)
  const [jitoRpc, setJitoRpc] = useState('')
  const [logsArr, setLogsArr] = useState<LogsType[]>([])

  const [config, setConfig] = useState({
    modeType: 1, //模式 1拉盘 2砸盘 3刷量
    thread: '1', //线程数
    spaceTime: '1', //间隔时间
    slippage: '5', //滑点
    amountType: 1, //1固定 2百分比 3随机
    minAmount: '',
    maxAmount: '',
    targetPrice: '', //目标价格
  })

  const [info, setInfo] = useState({
    _totalSol: 0,
    _totalTokenB: 0,
    _seleNum: 0,
    _seleSol: 0,
    _seleTokenB: 0,
  })
  useEffect(() => {
    getInfo()
  }, [walletConfig])
  const getInfo = () => {
    let _totalSol = 0
    let _totalTokenB = 0
    let _seleNum = 0
    let _seleSol = 0
    let _seleTokenB = 0
    walletConfig.forEach(item => {
      _totalSol += item.balance
      _totalTokenB += item.tokenBalance
      if (item.isCheck) {
        _seleNum += 1
        _seleSol += item.balance
        _seleTokenB += item.tokenBalance
      }
    })
    setInfo({
      _totalSol,
      _totalTokenB,
      _seleNum,
      _seleSol,
      _seleTokenB
    })
  }
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
  const logsArrChange = (label: string, color?: string, isLink?: boolean,) => {
    const obj: LogsType = { time: getCurrentTimestamp(), label, color, isLink }
    setLogsArr(item => [...item, obj])
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
      if (_walletConfig.length === 0) return api.error({ message: "请导入钱包私钥" })

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
      const _slippage = BigInt(Number(config.slippage) * 100)


      let amountIn = Number(config.minAmount)
      if (config.amountType === 2) { //百分比
        let balance = await connection.getBalance(account.publicKey)
        balance = balance / LAMPORTS_PER_SOL
        if (Number(config.modeType) == 2) {
          balance = await getSPLBalance(connection, QueteToken, account.publicKey)
        }
        amountIn = balance * Number(config.minAmount) / 100
      } else if (config.amountType === 3) {
        const min = Number(config.minAmount) * BASE_NUMBER
        const max = Number(config.maxAmount) * BASE_NUMBER
        amountIn = getRandomNumber(min, max) / BASE_NUMBER
      }

      const newTx = new Transaction()
      if (Number(config.modeType) === 1 || Number(config.modeType) === 3) {
        logsArrChange(`钱包${walletIndex + 1} ,买入${amountIn}sol`)
        const { buyTx, buyAmount } = await sdk.buy(account, QueteToken, BigInt((amountIn * LAMPORTS_PER_SOL).toFixed(0)), _slippage)
        newTx.add(buyTx)
        if (Number(config.modeType) === 3) {
          logsArrChange(`钱包${walletIndex + 1},卖出${buyAmount} ${token.symbol}`)
          const sellTx = await sdk.sell(account, QueteToken, buyAmount, _slippage)
          newTx.add(sellTx)
        }
      } else if (Number(config.modeType) === 2) {
        logsArrChange(`钱包${walletIndex + 1},卖出${amountIn} ${token.symbol}`)
        const sellTx = await sdk.sell(account, QueteToken, BigInt((amountIn * 1000000).toFixed(0)), _slippage)
        newTx.add(sellTx)
      }

      //增加费用，减少失败
      const versionedTx = await addPriorityFees(connection, newTx, account.publicKey);
      versionedTx.sign([account])
      const sig = await connection.sendTransaction(versionedTx, {
        skipPreflight: false,
      });
      logsArrChange(`${getTxLink(sig)}`, HASH_COLOR, true)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <SwapBotPage>
      {contextHolder1}
      <Header title='市值管理' hint='预设并自动执行交易指令，轻松实现批量在DEX交易，提高了交易的效率和时效性，特别适用于快速执行大量交易的场景' />

      <div className='swap'>
        <LeftPage>
          <div className='box'>
            <div className='header'>账号概览</div>
            <div className='flex justify-between mt-4'>
              <div className='box1 mr-4'>
                <div className='box1_header mb-3'>所有账户数量 {walletConfig.length}</div>
                <div>
                  <div className='mb-1'>SOL余额：{info._totalSol}</div>
                  <div className='mb-1'>价值代币余额：0</div>
                  <div className='mb-1'>Token余额：{info._totalTokenB}</div>
                </div>
              </div>
              <div className='box1'>
                <div className='box1_header mb-3'>启用账户数量 {info._seleNum}</div>
                <div>
                  <div className='mb-1'>SOL余额：{info._seleSol}</div>
                  <div className='mb-1'>价值代币余额：0</div>
                  <div className='mb-1'>Token余额：{info._seleTokenB}</div>
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

            <div className='flex items-center mt-4'>
              <div className='mr-3'>目标价格</div>
              <div>
                <Input value={config.targetPrice} onChange={configChange} name='targetPrice' />
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
          <WalletInfoCollection tokenAddr={token ? token.address : null} config={walletConfig}
            setConfig={setWalletConfig} isBot baseToken={baseToken.address} />
          <div className='logs'>
            <div className='header'>交易日志</div>
            <div>
              {logsArr.map((item, index) => (
                item.isLink ?
                  <div key={index}>{item.time}: 交易hash--
                    <a href={item.label} target='_blank' style={{ color: '#51d38e' }}>{item.label}</a>
                  </div>
                  :
                  <div key={index}>{item.time}: {item.label}</div>
              ))}
            </div>
          </div>
        </RightPage>
      </div>
    </SwapBotPage>
  )
}

export default SwapBot