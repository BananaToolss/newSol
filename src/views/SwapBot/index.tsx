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
import { Input_Style, Button_Style, isMainnet } from '@/config'
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
import { delay, getRandomNumber, getSPLBalance, getCurrentTimestamp, getSolPrice } from './utils';
import { ethers } from 'ethers';
import { getPoolPrice } from './usePoolPrice'

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
  const [baseToken, setBseToken] = useState<Token_Type>(PUMP) //
  const [token, setToken] = useState<Token_Type>(SOL)
  const [dexCount, setDexCount] = useState(1) // 1raydium 2pump
  const [walletConfig, setWalletConfig] = useState<CollocetionType[]>([]) //钱包信息


  const [isJito, setIsJito] = useState(false)
  const [jitoBindNum, setJitoBindNum] = useState(2)
  const [jitoFee, setJitoFee] = useState<number>(0)
  const [jitoRpc, setJitoRpc] = useState('')
  const [logsArr, setLogsArr] = useState<LogsType[]>([])

  const [config, setConfig] = useState({
    modeType: 1, //模式 1拉盘 2砸盘 3刷量
    thread: '1', //线程数
    spaceTime: '0', //间隔时间
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
      // if (walletConfig.length === 0) return logsArrChange('请导入钱包私钥', 'red')
      // if (!config.minAmount) return logsArrChange('请填写购买数量', 'red')
      // if (Number(config.amountType) === 3 && !config.maxAmount) return logsArrChange('请填写购买数量', 'red')
      // setIsStop(false)
      // setIsStart(true)
      if (dexCount === 1) {
        Raydium(0)
      }
      if (dexCount === 2) {
        pumpFun(0)
      }
    } catch (error) {
      console.log(error)
      setIsStart(false)
    }
  }

  const rayDiumGetPool = async (raydium: Raydium, mint1: PublicKey, mint2: PublicKey) => {
    try {
      let poolId = 'AWRmPJjhk5onj5DAKhybg8Z6k3hAYNe7jgazE9dy1KbF' //dev
      if (isMainnet) {
        const tokenPool: any = await raydium.api.fetchPoolByMints({ mint1, mint2 })
        poolId = tokenPool.data[0].id
      }
      return poolId
    } catch (error) {
      return error
    }
  }
  const getRaydiumPrice = async (raydium: Raydium, poolId: string) => {
    try {
      let price = ''
      if (isMainnet) {
        const _price = await getPoolPrice(poolId)
        price = _price.toFixed(18)
      } else {
        const data = await raydium.liquidity.getPoolInfoFromRpc({ poolId: poolId });
        const _price =
          data.poolInfo.mintA.address == baseToken.address
            ? data.poolInfo.mintAmountA / data.poolInfo.mintAmountB
            : data.poolInfo.mintAmountB / data.poolInfo.mintAmountA;
        price = _price.toFixed(18);
      }
      return price
    } catch (error) {
      return error
    }
  }

  const Raydium = async (index: number) => {
    const walletIndex = 0
    const _walletConfig = [...walletConfig]
    const raydiums: Raydium[] = []
    try {
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

      const mint1 = new PublicKey(baseToken.address)
      const mint2 = new PublicKey(token.address)
      const raydium = raydiums[walletIndex]
      const poolID = await rayDiumGetPool(raydium, mint1, mint2)

      const Token = new PublicKey(baseToken.address)
      const account = Keypair.fromSecretKey(bs58.decode(_walletConfig[walletIndex].privateKey))
      const { balance, amountIn } = await getAmountIn(account, Token)
      if (amountIn == 0 || balance == 0) {
        // setCurrentIndex(item => item + 1)
        return
      }

    } catch (error) {
      console.log(error)
    }
  }

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isStart, setIsStart] = useState(false)
  const [isStop, setIsStop] = useState(false)
  const [solPrice, setSolPrice] = useState('')

  useEffect(() => {
    getSprice()
  }, [])
  useEffect(() => {
    if (currentIndex > 0) {
      if (isStop) {
        logsArrChange('任务暂停执行', '#ac20fa')
        setIsStart(false)
        return
      }
      setTimeout(() => {
        pumpFun(currentIndex)
      }, Number(config.spaceTime) * 1000)
    }

  }, [currentIndex])

  const getSprice = async () => {
    try {
      setSolPrice(await getSolPrice())
    } catch (error: any) {
      setSolPrice(error)
    }
  }

  const [tokenPrice, setTokenPrice] = useState('')
  useEffect(() => {
    if (token && solPrice) getPumpPrice()
  }, [token, solPrice])
  const getPumpPrice = async () => {
    try {
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "finalized",
      });
      let sdk: PumpFunSDK = new PumpFunSDK(provider);
      const QueteToken = new PublicKey(token.address)

      const tokenPool = await sdk.getBondingCurveAccount(QueteToken)
      const capSOL = tokenPool.getMarketCapSOL()
      const _price = ethers.utils.formatEther(capSOL)
      const price = ethers.utils.parseEther(_price).mul(ethers.utils.parseEther(solPrice)).div(ethers.utils.parseEther('1'))
      const _pri = ethers.utils.formatEther(price)
      setTokenPrice(_pri)
    } catch (error) {
      setTokenPrice('')
    }
  }

  const getAmountIn = async (account: Keypair, QueteToken: PublicKey) => {
    try {
      let balance = await connection.getBalance(account.publicKey)
      const Solb = balance / LAMPORTS_PER_SOL

      let amountIn = 0
      if (Number(config.modeType) === 1 || Number(config.modeType) === 3) { //拉盘
        if (config.amountType === 1) {
          amountIn = Number(config.minAmount)
        } else if (config.amountType === 2) {
          amountIn = balance * Number(config.minAmount) / 100
        } else if (config.amountType === 3) {
          const min = Number(config.minAmount) * BASE_NUMBER
          const max = Number(config.maxAmount) * BASE_NUMBER
          amountIn = getRandomNumber(min, max) / BASE_NUMBER
        }
        amountIn = amountIn < Solb ? amountIn : 0
      }
      if (Number(config.modeType) === 2) { //砸盘
        const tokenB = await getSPLBalance(connection, QueteToken, account.publicKey)
        if (config.amountType === 1) {
          amountIn = Number(config.minAmount)
        } else if (config.amountType === 2) {
          amountIn = tokenB * Number(config.minAmount) / 100
        } else if (config.amountType === 3) {
          const min = Number(config.minAmount) * BASE_NUMBER
          const max = Number(config.maxAmount) * BASE_NUMBER
          amountIn = getRandomNumber(min, max) / BASE_NUMBER
        }
        amountIn = amountIn < tokenB ? amountIn : 0
      }
      return { balance, amountIn }
    } catch (error) {
      return { balance: 0, amountIn: 0 }
    }
  }

  const pumpFun = async (index: number) => {
    const _walletConfig = [...walletConfig]
    const walletIndex = index % _walletConfig.length

    try {
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "finalized",
      });
      let sdk: PumpFunSDK = new PumpFunSDK(provider);
      const Token = new PublicKey(baseToken.address)

      const tokenPool = await sdk.getBondingCurveAccount(Token)
      const capSOL = tokenPool.getMarketCapSOL()
      console.log(capSOL)
      const _price = ethers.utils.formatEther(capSOL)
      const price = ethers.utils.parseEther(_price).mul(ethers.utils.parseEther(solPrice)).div(ethers.utils.parseEther('1'))
      const _pri = ethers.utils.formatEther(price)
      logsArrChange(`代币价格：${_pri}`, '#eb9630')
      if (Number(config.modeType) === 1) {
        if (ethers.utils.parseEther(_pri).gte(ethers.utils.parseEther(config.targetPrice))) {
          setCurrentIndex(0)
          setIsStart(false)
          logsArrChange('拉盘任务完成', '#51d38e')
          return
        }
      }
      if (Number(config.modeType) === 2) {
        if (ethers.utils.parseEther(_pri).lte(ethers.utils.parseEther(config.targetPrice))) {
          setCurrentIndex(0)
          setIsStart(false)
          logsArrChange('砸盘任务完成', '#51d38e')
          return
        }
      }

      const account = Keypair.fromSecretKey(bs58.decode(_walletConfig[walletIndex].privateKey))
      const _slippage = BigInt(Number(config.slippage) * 100)
      const { balance, amountIn } = await getAmountIn(account, Token)
      if (amountIn == 0 || balance == 0) {
        setCurrentIndex(item => item + 1)
        return
      }

      const newTx = new Transaction()
      if (Number(config.modeType) === 1 || Number(config.modeType) === 3) {
        logsArrChange(`钱包${walletIndex + 1} ,买入${amountIn}sol`)
        const { buyTx, buyAmount } = await sdk.buy(account, Token, BigInt((amountIn * LAMPORTS_PER_SOL).toFixed(0)), _slippage)
        newTx.add(buyTx)
        if (Number(config.modeType) === 3) {
          logsArrChange(`钱包${walletIndex + 1},卖出${buyAmount} ${token.symbol}`)
          const sellTx = await sdk.sell(account, Token, buyAmount, _slippage)
          newTx.add(sellTx)
        }
      } else if (Number(config.modeType) === 2) {
        logsArrChange(`钱包${walletIndex + 1},卖出${amountIn} ${token.symbol}`)
        const sellTx = await sdk.sell(account, Token, BigInt((amountIn * 1000000).toFixed(0)), _slippage)
        newTx.add(sellTx)
      }

      //增加费用，减少失败
      const versionedTx = await addPriorityFees(connection, newTx, account.publicKey);
      versionedTx.sign([account])
      const sig = await connection.sendTransaction(versionedTx, {
        skipPreflight: false,
      });
      logsArrChange(`${getTxLink(sig)}`, HASH_COLOR, true)

      setCurrentIndex(item => item + 1)
    } catch (error) {
      console.log(error)
      logsArrChange(`执行失败`, 'red')
      setCurrentIndex(item => item + 1)
    }
  }

  const stopClick = () => {
    setIsStop(true)
  }

  useEffect(() => {
    scrollBottom()
  }, [logsArr])
  const scrollBottom = () => {
    const div = document.getElementById('scrolldIV')
    if (div) div.scrollTop = div.scrollHeight
  }

  return (
    <SwapBotPage>
      {contextHolder1}
      <Header title='市值管理' hint='预设并自动执行交易指令，轻松实现批量在DEX交易，提高了交易的效率和时效性，特别适用于快速执行大量交易的场景' />
      {solPrice}
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
                <SelectToken selecToken={token} callBack={tokenClick} isBot />
              </div>
              <div className='flex-1'>
                <div>做市代币</div>
                <SelectToken selecToken={baseToken} callBack={baseTokenClick} isBot />
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

            <div className='mt-4'>
              当前代币价格：{tokenPrice}
            </div>
            <div className='flex items-center'>
              <div className='mr-3'>目标价格</div>
              <div>
                <Input value={config.targetPrice} onChange={configChange} name='targetPrice' />
              </div>
            </div>
          </div>

          <div className='btn mt-5'>
            <div className='buttonSwapper mt-4'>
              <Button className={Button_Style} onClick={startClick} loading={isStart}>开始执行</Button>
              <Button className={Button_Style} onClick={stopClick}>停止</Button>

            </div>
            <div className='fee'>全网最低服务费0.002SOL每笔交易</div>
          </div>

        </LeftPage>
        <RightPage>
          <WalletInfoCollection tokenAddr={token ? token.address : null} config={walletConfig}
            setConfig={setWalletConfig} isBot baseToken={baseToken.address} />
          <div className='logs'>
            <div className='header'>
              <div>交易日志</div>
              <Button type='primary' onClick={() => setLogsArr([])}>清空日志</Button>
            </div>
            <div className='scrolldIV' id='scrolldIV'>
              {logsArr.map((item, index) => (
                item.isLink ?
                  <div key={index}>{item.time}: 交易hash--
                    <a href={item.label} target='_blank' style={{ color: '#51d38e' }}>{item.label}</a>
                  </div>
                  :
                  <div key={index} style={{ color: item.color }}>{item.time}: {item.label}</div>
              ))}
            </div>
          </div>
        </RightPage>
      </div>
    </SwapBotPage>
  )
}

export default SwapBot