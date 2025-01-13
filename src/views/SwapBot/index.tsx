import { useState, useEffect, useRef } from 'react'
import {
  Api, Raydium, TxVersion,
  ApiV3PoolInfoStandardItem,
  AmmV4Keys, AmmRpcData,
  ApiV3PoolInfoStandardItemCpmm,
  CpmmRpcData,
  CpmmKeys,
  ApiV3Token,
  CurveCalculator
} from '@raydium-io/raydium-sdk-v2'
import { Radio, Input, Select, Switch, Button, notification, message } from 'antd'
import type { RadioChangeEvent } from 'antd';
import { Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL, TransactionInstruction, Connection } from '@solana/web3.js';
import { AnchorProvider } from "@coral-xyz/anchor";
import { ethers } from 'ethers';
import bs58 from "bs58";
import BN from "bn.js";
import Decimal from 'decimal.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Header, SelectToken, Segmentd, WalletInfoCollection, JitoFee } from '@/components'
import type { Token_Type, CollocetionType } from '@/type'
import { SOL, PUMP, RAYAMM, SOL_TOKEN, CPMM } from '@/config/Token'
import { Input_Style, Button_Style, network } from '@/config'
import { initSdk, txVersion } from '@/Dex/Raydium'
import { PumpFunSDK } from "@/Dex/Pump";
import { getTxLink, addPriorityFees, addressHandler } from '@/utils'
import { delay, getRandomNumber, getSPLBalance, getCurrentTimestamp } from './utils';
import { PumpFunSwap, RaydiumSwap, getRayDiumPrice, getPumpPrice, getAmountIn, getSolPrice } from './Trade'
import {
  SwapBotPage,
  LeftPage,
  RightPage,
  Card
} from './style'


interface LogsType {
  time: string
  label: string
  color?: string
  isLink?: boolean
  account?: string
}
const BASE_NUMBER = 10000
const HASH_COLOR = '#51d38e'

const options = [
  { value: '1', label: '不捆绑' },
  { value: '2', label: '捆绑2个地址' },
  { value: '3', label: '捆绑3个地址' },
  { value: '4', label: '捆绑4个地址' },
]

function SwapBot() {
  const { connection } = useConnection();
  const wallet = useWallet()
  const [messageApi, contextHolder] = message.useMessage();
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
    thread: '0', //线程数
    spaceTime: '1', //间隔时间
    slippage: '5', //滑点
    amountType: 1, //1固定 2百分比 3随机
    minAmount: '0.01',
    maxAmount: '0.01',
    targetPrice: '1', //目标价格
    loop: '2', //刷量次数
  })
  const [info, setInfo] = useState({
    _totalSol: 0,
    _totalTokenB: 0,
    _seleNum: 0,
    _seleSol: 0,
    _seleTokenB: 0,
  })
  const [currentIndex, setCurrentIndex] = useState(0) //执行次数
  const [isStart, setIsStart] = useState(false)
  const [isStop, setIsStop] = useState(false)
  const [tokenPrice, setTokenPrice] = useState('') //代币价格

  useEffect(() => {
    if (token) getTonePrice()
    if (dexCount == 2) {
      setConfig({ ...config, modeType: 1 })
    }
  }, [dexCount, token, baseToken])
  useEffect(() => {
    getInfo()
  }, [walletConfig])
  useEffect(() => {
    if (window.location.hash && window.location.hash === '#/pump/swapbot') {
      setDexCount(2)
      setConfig({ ...config, modeType: 3 })
    }
  }, [window.location.hash])

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
  const logsArrChange = (label: string, color?: string, isLink?: boolean, account?: string) => {
    const obj: LogsType = { time: getCurrentTimestamp(), label, color, isLink, account }
    setLogsArr(item => [...item, obj])
  }
  const jitoCallBack = (jitoFee_: number, jitoRpc_: string) => {
    setJitoFee(jitoFee_)
    setJitoRpc(jitoRpc_)
  }
  const optionsChange = (value: string) => {
    setJitoBindNum(Number(value))
  }

  const provider = new AnchorProvider(connection, wallet, {
    commitment: "finalized",
  });
  let sdk: PumpFunSDK = new PumpFunSDK(provider);

  const getTonePrice = async () => {
    try {
      let price = ''
      const solPrice = await getSolPrice()
      if (dexCount === 1) {
        const account = Keypair.generate()
        const raydium = await initSdk({ owner: account.publicKey, connection: connection })
        price = await getRayDiumPrice(raydium, new PublicKey(token.address), new PublicKey(baseToken.address))
      }
      if (dexCount === 2) {
        price = await getPumpPrice(sdk, new PublicKey(baseToken.address), solPrice)
      }
      setTokenPrice(price)
    } catch (error) {
      console.log(error)
    }
  }
  //统计信息
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
      _totalSol: Number(_totalSol.toFixed(4)),
      _totalTokenB: Number(_totalTokenB.toFixed(4)),
      _seleNum,
      _seleSol: Number(_seleSol.toFixed(4)),
      _seleTokenB: Number(_seleTokenB.toFixed(4))
    })
  }

  const workersRef = useRef<any[]>([]);
  const TaskRef = useRef<NodeJS.Timeout>(null);

  const startClick = async () => {
    try {
      if (workersRef.current) {
        workersRef.current = [1]
      }
      if (walletConfig.length === 0) return logsArrChange('请导入钱包私钥', 'red')
      if (!config.minAmount) return logsArrChange('请填写购买数量', 'red')
      if (Number(config.amountType) === 3 && !config.maxAmount) return logsArrChange('请填写购买数量', 'red')
      if (Number(config.modeType) !== 3 && !config.targetPrice) return logsArrChange('请填写目标价格', 'red')
      if (Number(config.modeType) === 1 && Number(config.targetPrice) <= Number(tokenPrice))
        return logsArrChange('拉盘目标价格需要大于当前价格', 'red')
      if (Number(config.modeType) === 2 && Number(config.targetPrice) >= Number(tokenPrice))
        return logsArrChange('砸盘目标价格需要小于当前价格', 'red')

      setIsStop(false)
      setIsStart(true)
      const _config = [...walletConfig]
      const _walletConfig = _config.filter(item => item.isCheck)
      console.log(_walletConfig)
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
          await delay(150)
        }
        console.log(`钱包准备就绪`)
      }

      const url = `${window.location.origin}/worker1.js`
      if (TaskRef.current) clearInterval(TaskRef.current)

      let waitingForConfirmation: boolean; //执行中
      let walletIndexes = 0
      let round = 0 //执行轮数

      const QueteToken = new PublicKey(token.address)
      const BaseToken = new PublicKey(baseToken.address)
      const solPrice = await getSolPrice()

      if (Number(config.thread) >= 1) {
        for (let index = 0; index < Number(config.thread); index++) {
          workersRef.current[index] = new Worker(url, { name: `${index}` })
          workersRef.current[index].postMessage({
            eventName: 'START',
            total: Math.ceil(_walletConfig.length / Number(config.thread)),
            threadIndex: index,
            spaceTime: Number(config.spaceTime) * 1000
          })
          workersRef.current[index].onmessage = (e) => {
            console.log(e.data, '接收数据')
            const { walletIndex, threadIndex } = e.data
            // let walletIndex = 0
            try {
              threadFun(_walletConfig, walletIndex, raydiums[walletIndex], solPrice, QueteToken, BaseToken)
            } catch (error) {
              console.log(error, 'error')
            }
          }
        }
      } else {
        TaskRef.current = setInterval(async () => {
          try {
            if (waitingForConfirmation) {
              console.log("还在交易中");
              return;
            }
            if (isStop) console.log('任务暂停')
            waitingForConfirmation = true;
            console.log(walletIndexes, '开始walletIndexes')
            try {
              await threadFun(_walletConfig, walletIndexes, raydiums[walletIndexes], solPrice, QueteToken, BaseToken)
            } catch (error) {
            }

            waitingForConfirmation = false;
            if (walletIndexes == _walletConfig.length - 1) {
              walletIndexes = 0;
              round += 1;
              if (Number(config.modeType) === 3 && Number(config.loop) <= round) {
                logsArrChange('刷量任务完成', HASH_COLOR)
                stopClick()
                waitingForConfirmation = true
              }
            } else {
              walletIndexes++
            }
          } catch (error) {
            console.error("获取交易失败:", error);
          }
        }, 1000)
      }
    } catch (error) {
      console.log(error)
      setIsStart(false)
    }
  }

  const threadFun = (_walletConfig: CollocetionType[], index: number, raydium: Raydium | null, solPrice: string,
    QueteToken: PublicKey,
    BaseToken: PublicKey,
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!_walletConfig[index]) return
        const account = Keypair.fromSecretKey(bs58.decode(_walletConfig[index].privateKey));
        logsArrChange(`开始执行钱包${addressHandler(account.publicKey.toBase58())}`)

        let state = true
        const { balance, amountIn } = await getAmountIn(connection, account, BaseToken,
          Number(config.modeType), Number(config.amountType), Number(config.minAmount), Number(config.maxAmount))
        if (balance === 0 || amountIn === 0) {
          state = false
          logsArrChange(`${addressHandler(account.publicKey.toBase58())}余额不足，跳过该钱包`, '#f9d236')
        }
        let _tokenPrice = ''
        let signer = ''
        console.log(`${addressHandler(account.publicKey.toBase58())}`, balance, amountIn, state, ' balance')
        if (state) {
          if (Number(config.modeType) === 1) {
            logsArrChange(`花费${amountIn} ${token.symbol}购买`)
          } else if (Number(config.modeType) == 2) {
            logsArrChange(`出售${amountIn} ${baseToken.symbol}`)
          } else {
            logsArrChange(`使用${amountIn} ${token.symbol}刷量`)
          }
          console.log(amountIn, 'amountIn')
          if (dexCount === 1) {
            const { signature, price } = await RaydiumSwap(connection, raydium, account, Number(config.modeType), QueteToken, BaseToken, amountIn,
              Number(config.slippage) / 100,)
            signer = signature
            const _price = ethers.utils.parseEther(price).mul(ethers.utils.parseEther(solPrice)).div(ethers.utils.parseEther('1'))
            _tokenPrice = ethers.utils.formatEther(_price)
          } else {
            signer = await PumpFunSwap(connection, sdk, account, Number(config.modeType), BaseToken,
              amountIn * 10 ** baseToken.decimals, BigInt(Number(config.slippage) * 100))
            if (Number(config.modeType) !== 3) {
              _tokenPrice = await getPumpPrice(sdk, new PublicKey(baseToken.address), solPrice)
            }
          }
        }
        if (isStop) console.log('任务暂停')
        if (signer) {
          logsArrChange(signer, HASH_COLOR, true, addressHandler(account.publicKey.toBase58()))
        } else {
          if (state) logsArrChange(`交易失败`, 'red', false, addressHandler(account.publicKey.toBase58()))
        }

        if (_tokenPrice) logsArrChange(`当前代币价格: ${_tokenPrice}`)
        if (Number(config.modeType) === 1 && Number(config.targetPrice) <= Number(_tokenPrice) && _tokenPrice) {
          logsArrChange(`拉盘任务完成`)
          stopClick()
        }
        if (Number(config.modeType) === 2 && Number(config.targetPrice) >= Number(_tokenPrice) && _tokenPrice) {
          logsArrChange(`砸盘任务完成`)
          stopClick()
        }

        if (Number(config.thread) <= 0) logsArrChange(`暂停${config.spaceTime}秒`)
        await delay(Number(config.spaceTime) * 1000);
        resolve(true)
      } catch (error) {
        console.log(error, 'error')
        logsArrChange(`${error.toString()}`, 'red')
        reject(false)
      }
    })
  }

  const closeTask = () => {
    setIsStart(false)
    logsArrChange(`停止任务`, '#ffca28')
    if (TaskRef) clearInterval(TaskRef.current)
    if (workersRef.current) workersRef.current.forEach((worker, index) => {
      worker.postMessage({ eventName: 'CLOSE' })
      worker.terminate()
    })
    workersRef.current = []
    console.log(workersRef.current)
  }
  const stopClick = () => {
    setIsStop(false)
    setIsStart(false)
    closeTask()
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
            {/* <div className='flex mt-5'>
              <div className='mr-2'>jito MEV模式</div>
              <Switch checked={isJito} onChange={(e) => setIsJito(e)} />
            </div> */}
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

            <div className='flex items-center mt-5'>
              <div className='font-semibold'>模式：</div>
              <Radio.Group onChange={modeTypeChange} value={config.modeType}>
                <Radio value={1}>拉盘</Radio>
                <Radio value={2}>砸盘</Radio>
                {dexCount === 2 && <Radio value={3}>防夹刷量</Radio>}
              </Radio.Group>
            </div>
            {config.modeType === 3 &&
              <div className='flex items-center mt-3'>
                <div>刷量次数：</div>
                <div>
                  <Input value={config.loop} onChange={configChange} name='loop' type='number' />
                </div>
              </div>
            }

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
          <WalletInfoCollection tokenAddr={token ? baseToken.address : null} config={walletConfig}
            setConfig={setWalletConfig} isBot baseToken={token.address} />
          <div className='logs'>
            <div className='header'>
              <div>交易日志</div>
              <Button type='primary' onClick={() => setLogsArr([])}>清空日志</Button>
            </div>
            <div className='scrolldIV' id='scrolldIV'>
              {logsArr.map((item, index) => (
                item.isLink ?
                  <div key={index}>{item.time}: 交易hash--
                    <a href={getTxLink(item.label)} target='_blank' style={{ color: '#51d38e' }}>
                      {item.account}： {item.label}
                    </a>
                  </div>
                  :
                  <div key={index} style={{ color: item.color }}>{item.time}: {item.account}{item.label}</div>
              ))}
            </div>
          </div>
        </RightPage>
      </div>
    </SwapBotPage>
  )
}

export default SwapBot