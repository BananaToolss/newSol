import { useState, useEffect, useCallback, useRef, isValidElement } from 'react'
import { Button, Radio, message, Segmented } from 'antd'
import { DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons'
import type { RadioChangeEvent } from 'antd';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Connection,
  Commitment,
  Finality,
  Transaction,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  AmmRpcData,
  AmmV4Keys,
  ApiV3PoolInfoStandardItem,
  ApiV3PoolInfoStandardItemCpmm,
  CpmmKeys,
  CpmmRpcData,
  CurveCalculator,
} from "@raydium-io/raydium-sdk-v2";
import bs58 from "bs58";
import BN from "bn.js";
import dotenv from "dotenv";
import { DEFAULT_DECIMALS, PumpFunSDK } from "pumpdotfun-sdk";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { AnchorProvider } from "@coral-xyz/anchor";
import Decimal from 'decimal.js'
import { Program, Provider } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "new-spl-token";
import { useTranslation } from "react-i18next";

import { getImage, addressHandler, getCurrentTimestamp, getTxLink } from '@/utils'
import { isValidAmm } from "@/utils/ray";
import { initSdk, RaydiumApi, txVersion } from '@/utils/raydiumConfig'
import {
  Button_Style1 as Button_Style, Input_Style, isMainnet,
  PROJECT_ADDRESS,
  SWAP_BOT_FEE,
  PUMP_SWAP_BOT_FEE
} from '@/config'
import { SOL_TOKEN, USDC_TOKEN, USDT_TOKEN } from '@/config/Token'
import Header from '../Header'
import SelectToken from './SelectToken'
import PrivateKeyPage from './PrivateKeyPage'
import {
  SwapBot
} from './style'
import {
  getOrCreateKeypair,
  getSPLBalance,
  printSOLBalance,
  printSPLBalance,
  fromSecretKey,
  getRandomNumber
} from "./util";
import { GlobalAccount } from "./globalAccount";
import { PumpFun, IDL } from "./IDL";
import { calculateWithSlippageBuy, calculateWithSlippageSell } from './util'
import { BondingCurveAccount } from "./bondingCurveAccount";


const SLIPPAGE_BASIS_POINTS = 100n;
const PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const MPL_TOKEN_METADATA_PROGRAM_ID =
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

export const GLOBAL_ACCOUNT_SEED = "global";
export const MINT_AUTHORITY_SEED = "mint-authority";
export const BONDING_CURVE_SEED = "bonding-curve";
export const METADATA_SEED = "metadata";
export const DEFAULT_COMMITMENT: Commitment = "finalized";
export const DEFAULT_FINALITY: Finality = "finalized";


type walletInfo = {
  walletAddr: string;
  solBalance: number;
  baseTokenBlance: number | undefined;
  targetTokenBalance: number | undefined;
};

interface Test {
  time: string
  data: string
  isHash?: string
  color?: string
}

const BASE_NUMBER = 10000

const ERROR_COLOR = '#ff004d'
const END_COLOR = '#2014cf'
const HASH_COLOR = '#63e2bd'

const JITO_ARR = ['0.000001', '0.00005', '0.0001']

const pool_v2 = 'F1jyX42oFQhmxp21e9fpU3vNNtxgXQ4pc7dREPbXkTCq'
const pool_v3 = '2xRcCvm5R5QZyFoESKk1dRKdQuaGWvv8aj3TFx4UMRCs'



function Swapbot() {
  const [messageApi, contextHolder] = message.useMessage()
  const { connection } = useConnection();
  const { t } = useTranslation()
  const [privateKeys, setPrivateKeys] = useState([]) //私钥数组
  const [addressArr, setAddressArr] = useState([]) //钱包地址数组
  const [walletsArrInfo, setWalletsArrInfo] = useState<walletInfo[]>([]);

  const [config, setConfig] = useState({
    baseToken: SOL_TOKEN,
    targetToken: USDC_TOKEN,
    rpc: '',
    minTime: '1',
    maxTime: '1',
    slippage: '5',
    poolType: 2, // 1 Raydiumv2, 2 Raydiumv3 
    amountType: 3, // 1全部,2随机,3固定
    amount: '0.01', //固定数量
    minAmount: '0.01',
    maxAmount: '0.02',
    modeType: 1, //1拉盘，2砸盘
    targetPrice: '',
    jitoType: 1, // 1默认，2快速，3超快速
    jitoFee: JITO_ARR[0],
    loop: '1'
  })
  const [transferType, setTransferType] = useState<string | number>(t('Raydium Market Cap Management'));
  const [baseSymbol, setBaseSymbol] = useState('Sol')
  const [targetSymbol, setTargetSymbol] = useState('USDC')

  useEffect(() => {
    getAddressArr()
  }, [privateKeys])
  useEffect(() => {
    if (addressArr.length > 0) getWalletInfo(0)
  }, [addressArr, config.targetToken])
  useEffect(() => {
    if (walletsArrInfo.length > 0) getWalletInfo(walletsArrInfo.length)
  }, [walletsArrInfo])

  //**钱包私钥数组 */
  const privateKeyCallBack = (keys: string) => {
    const resultArr = keys.split(/[(\r\n)\r\n]+/)
    const _privateKeys = resultArr.filter((item: string) => item !== '')
    setPrivateKeys(_privateKeys)
  }
  //**钱包地址 */
  const getAddressArr = () => {
    if (privateKeys.length === 0) return setAddressArr([])
    const _addressArr = []
    privateKeys.forEach(async (item, index) => {
      const address = await fromSecretKey(item)
      if (address) {
        _addressArr.push(address)
      } else {
        messageApi.error(`第${index + 1}个私钥格式错误，跳过该钱包`)
      }
    })
    setAddressArr(_addressArr) //公钥
  }
  //**获取钱包代币信息 */
  const getWalletInfo = async (index: number) => {
    let solBalance = 0
    let baseTokenBlance = 0
    let targetTokenBalance = 0
    let _walletAddr = addressArr[index]
    if (!_walletAddr) return
    let walletAddr = new PublicKey(_walletAddr)

    solBalance = await printSOLBalance(connection, walletAddr)

    if (config.baseToken !== SOL_TOKEN) {
      baseTokenBlance = await getSPLBalance(connection, new PublicKey(config.baseToken), walletAddr)
    } else {
      baseTokenBlance = solBalance
    }

    if (config.targetToken !== SOL_TOKEN) {
      targetTokenBalance = await getSPLBalance(connection, new PublicKey(config.targetToken), walletAddr)
    } else {
      targetTokenBalance = solBalance
    }

    const _info = {
      walletAddr: _walletAddr,
      solBalance,
      baseTokenBlance,
      targetTokenBalance
    }
    index === 0 ? setWalletsArrInfo([_info]) : setWalletsArrInfo([...walletsArrInfo, _info])
  }
  const deleteClick = (index: number) => {
    const _keys = [...privateKeys]
    _keys.splice(index, 1)
    setPrivateKeys(_keys)
  }
  //*更新钱包信息*/
  const updataWallet = () => {
    if (privateKeys.length > 0) getWalletInfo(0)
  }
  const baseTokenChange = (value: string, symbol: string) => {
    setConfig({ ...config, baseToken: value })
    setBaseSymbol(symbol)
  }
  const targetTokenChange = (value: string, symbol: string) => {
    setConfig({ ...config, targetToken: value })
    setTargetSymbol(symbol)
  }
  const configChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }
  const poolTypeChange = (type: number) => {
    setConfig({ ...config, poolType: type })
  }
  const amountTypeChange = (e: RadioChangeEvent) => {
    setConfig({ ...config, amountType: Number(e.target.value) })
  }
  const modeTypeChange = (e: RadioChangeEvent) => {
    setConfig({ ...config, modeType: Number(e.target.value) })
  }
  const jitoTypeChange = (type: number) => {
    setConfig({ ...config, jitoType: type, jitoFee: JITO_ARR[type - 1] })
  }

  //** 市值逻辑 */
  const [logsArr, setLogsArr] = useState<any[]>([]);
  const [poolId, setPoolId] = useState<string>(""); //池子地址
  const newArr = useRef<Test[]>([])

  const updateData = () => {
    setLogsArr([...newArr.current]); // 更新 state 以触发重新渲染
  };
  // 日志方法
  const setLogHandler = (data: string, color?: string, isHash?: string,) => {
    newArr.current.push({ time: getCurrentTimestamp(), data, isHash, color });
    updateData();
  }

  const cleanLog = () => {
    setLogsArr([])
    newArr.current = []
    message.success("清除成功");
  };

  const getTokenSymbol = (address: string) => {
    if (config.targetToken === address) {
      return targetSymbol
    } else {
      return baseSymbol
    }
  }
  //**查找池子地址 */
  const getPoolAddress = () => {
    return new Promise(async (resolve: (value: string) => void, reject) => {
      try {
        let _poolId = ''
        if (isMainnet) {
          const owner = Keypair.generate()
          const raydium = await initSdk({ owner, connection: newConnection })

          const mint1 = new PublicKey(config.baseToken)
          const mint2 = new PublicKey(config.targetToken)

          const tokenPool: any = await raydium.api.fetchPoolByMints({ mint1, mint2 })
          _poolId = tokenPool.data[0].id
          setPoolId(_poolId)
        } else {
          _poolId = config.poolType === 1 ? pool_v2 : pool_v3
          setPoolId(_poolId)
        }
        setLogHandler(`池子地址：${_poolId}`)
        resolve(_poolId)
      } catch (error) {
        const err = (error as any)?.message;
        console.log(error)
        messageApi.error(err)
        setLogHandler(`查池子报错${err}`, ERROR_COLOR)
        reject(null)
      }
    })
  }

  const [isStartSwap, setIsStartSwap] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentLoop, setCurrentLoop] = useState(0)

  useEffect(() => {
    if (currentIndex > 0 && isStartSwap) {
      let _currentIndex = currentIndex
      console.log(_currentIndex, '_currentIndex')
      if (currentIndex % privateKeys.length === 0) {
        setLogHandler('所有钱包执行完一次', END_COLOR)
        if (Number(config.loop) <= currentLoop + 1) {
          setLogHandler('任务完成', END_COLOR)
          setCurrentIndex(0)
          setCurrentLoop(0)
          setIsStartSwap(false)
          return
        } else {
          setLogHandler(`将开始第${currentLoop + 2}次循环执行`, END_COLOR)
          setCurrentLoop(currentLoop + 1)
          _currentIndex = 0
        }
      }
      const time = getRandomNumber(Number(config.minTime), Number(config.maxTime))
      setLogHandler(`暂停${time}秒，开始下个钱包执行`)
      transferType === t('Raydium Market Cap Management') ? rayDiumSwap(_currentIndex) : pumpStartTwo(_currentIndex)
    }
  }, [currentIndex])


  //* 开始交易 */
  const start = () => {
    if (privateKeys.length <= 0) return messageApi.error("请先导入钱包")
    if (!config.targetToken) return messageApi.error("请选择目标代币")
    if (config.baseToken === SOL_TOKEN && config.modeType === 1 && config.amountType === 1) {
      return messageApi.error("购买模式下，基本代币为S0L 金额不能选择全部类型")
    }
    if (config.amountType === 1 && Number(config.loop) > 1) {
      return messageApi.error('金额全部模式下，循环执行轮数不能大于1')
    }
    transferType === t('Raydium Market Cap Management') ? rayDiumSwap(0) : pumpStartTwo(0)
    setIsStartSwap(true)
  }
  const stopSwap = () => {
    setIsStartSwap(false)
    setLogHandler(`暂停执行`, ERROR_COLOR)
  }

  //**Raydium市值管理 */
  const newConnection = config.rpc == "" ? connection : new Connection(config.rpc);
  const rayDiumSwap = async (walletIndex: number) => {
    try {
      let poolIdAddr = poolId
      if (!poolId) {
        poolIdAddr = await getPoolAddress()
      }
      if (!poolIdAddr) {
        setIsStartSwap(false)
        setLogHandler(`池子不存在`, ERROR_COLOR)
        return
      }
      console.log(`池子地址：${poolIdAddr}`)
      const owner = Keypair.fromSecretKey(bs58.decode(privateKeys[walletIndex]))
      const ownerAddress = addressHandler(owner.publicKey.toBase58())
      setLogHandler(`开始执行（钱包${walletIndex + 1}地址：${ownerAddress}）`)
      //初始化raydium
      let raydium = await initSdk({ owner, connection: newConnection })

      let amountIn = 0

      //目标代币
      let inputMint = config.targetToken;

      //花费代币
      const token = config.modeType === 1 ? config.baseToken : config.targetToken
      //金额判断
      if (config.amountType === 1) { //全部
        if (token === SOL_TOKEN) {
          amountIn = await printSOLBalance(newConnection, owner.publicKey)
        } else {
          amountIn = await getSPLBalance(newConnection, new PublicKey(token), owner.publicKey)
        }
      } else if (config.amountType === 2) { //随机
        const min = Number(config.minAmount) * BASE_NUMBER
        const max = Number(config.maxAmount) * BASE_NUMBER
        amountIn = getRandomNumber(min, max) / BASE_NUMBER
      } else { //固定
        amountIn = Number(config.amount)
      }
      //余额判断
      let tokenBalance = 0
      if (token === SOL_TOKEN) {
        tokenBalance = await printSOLBalance(newConnection, owner.publicKey)
      } else {
        tokenBalance = await getSPLBalance(newConnection, new PublicKey(token), owner.publicKey)
      }
      console.log(token, tokenBalance.toString(), amountIn, '花费代币余额')
      if (tokenBalance <= 0) {
        setLogHandler(`余额0，跳过该钱包`)
        setCurrentIndex(walletIndex + 1)
        return
      }
      if ((tokenBalance) < amountIn) {
        setLogHandler(`余额不足${amountIn}，跳过该钱包`)
        setCurrentIndex(walletIndex + 1)
        return
      }

      let transferHash = ''
      if (config.poolType === 1) {
        console.log('开始v2交易')
        //v2交易
        let poolInfo: ApiV3PoolInfoStandardItem | undefined;
        let poolKeys: AmmV4Keys | undefined;
        let rpcData: AmmRpcData;

        if (isMainnet) {
          const data = await raydium.api.fetchPoolById({ ids: poolId });
          poolInfo = data[0] as ApiV3PoolInfoStandardItem;
          if (!isValidAmm(poolInfo.programId)) return messageApi.error("target pool is not AMM pool")
          poolKeys = await raydium.liquidity.getAmmPoolKeys(poolId);
          rpcData = await raydium.liquidity.getRpcPoolInfo(poolId);
        } else {
          const data = await raydium.liquidity.getPoolInfoFromRpc({ poolId });
          poolInfo = data.poolInfo;
          poolKeys = data.poolKeys;
          rpcData = data.poolRpcData;
        }

        const [baseReserve, quoteReserve, status] = [
          rpcData.baseReserve,
          rpcData.quoteReserve,
          rpcData.status.toNumber(),
        ];

        if (poolInfo.mintA.address !== inputMint && poolInfo.mintB.address !== inputMint) return messageApi.error('input mint does not match pool')
        const baseIn = inputMint === poolInfo.mintB.address ? true : false;

        //买
        let mintIn, mintOut;
        if (config.modeType === 1) {
          // 买入
          [mintIn, mintOut] = baseIn
            ? [poolInfo.mintA, poolInfo.mintB]
            : [poolInfo.mintB, poolInfo.mintA];
        } else {
          //卖出
          [mintIn, mintOut] = baseIn
            ? [poolInfo.mintB, poolInfo.mintA]
            : [poolInfo.mintA, poolInfo.mintB];
        }

        const out = raydium.liquidity.computeAmountOut({
          poolInfo: {
            ...poolInfo,
            baseReserve,
            quoteReserve,
            status,
            version: 4,
          },
          amountIn: new BN(amountIn * 10 ** (mintIn.decimals)), //判断精度
          mintIn: mintIn.address,
          mintOut: mintOut.address,
          slippage: Number(config.slippage) / 100, //滑点 // range: 1 ~ 0.0001, means 100% ~ 0.01%
        });

        setLogHandler(
          `花费 ${amountIn} ${mintIn.symbol || getTokenSymbol(mintIn.address)} 交换 ${new Decimal(out.amountOut.toString())
            .div(10 ** mintOut.decimals)
            .toDecimalPlaces(mintOut.decimals)
            .toString()} ${mintOut.symbol || getTokenSymbol(mintOut.address)}, 最小得到数量 ${new Decimal(out.minAmountOut.toString())
              .div(10 ** mintOut.decimals)
              .toDecimalPlaces(mintOut.decimals)} ${mintOut.symbol || getTokenSymbol(mintOut.address)}`)
        //交易
        let { execute } = await raydium.liquidity.swap({
          poolInfo,
          poolKeys,
          amountIn: new BN(amountIn * 10 ** (mintIn.decimals)),
          amountOut: out.minAmountOut,
          fixedSide: "in",
          inputMint: mintIn.address,
          txVersion,
          computeBudgetConfig: {
            // units: 250000,
            microLamports: Number(config.jitoFee) * 1000000,
          },
        });
        const { txId } = await execute({ sendAndConfirm: true });
        transferHash = txId
      } else {
        console.log('开始v3交易')
        //V3交易
        let poolInfo: ApiV3PoolInfoStandardItemCpmm;
        let poolKeys: CpmmKeys | undefined;
        let rpcData: CpmmRpcData;

        if (isMainnet) {
          const data = await raydium.api.fetchPoolById({ ids: poolId });
          poolInfo = data[0] as ApiV3PoolInfoStandardItemCpmm;
          if (!isValidElement(poolInfo.programId)) return messageApi.error("target pool is not CPMM pool")
          rpcData = await raydium.cpmm.getRpcPoolInfo(poolInfo.id, true);
        } else {
          const data = await raydium.cpmm.getPoolInfoFromRpc(poolId);
          poolInfo = data.poolInfo;
          poolKeys = data.poolKeys;
          rpcData = data.rpcData;
        }

        if (inputMint !== poolInfo.mintA.address && inputMint !== poolInfo.mintB.address) return message.error('input mint does not match pool')

        let _inputMint;
        if (config.modeType === 1) { //买
          _inputMint = inputMint == poolInfo.mintA.address ? poolInfo.mintB : poolInfo.mintA;
        } else {
          _inputMint = inputMint == poolInfo.mintA.address ? poolInfo.mintA : poolInfo.mintB;
        }

        const baseIn = _inputMint.address === poolInfo.mintA.address ? true : false;

        const swapResult = CurveCalculator.swap(
          new BN(amountIn * 10 ** (_inputMint.decimals)),
          baseIn ? rpcData.baseReserve : rpcData.quoteReserve,
          baseIn ? rpcData.quoteReserve : rpcData.baseReserve,
          rpcData.configInfo!.tradeFeeRate
        );
        console.log(baseIn, amountIn, 'amountIn', new BN(amountIn * 10 ** (_inputMint.decimals)).toString())

        const _mode = config.modeType === 1 ? '购买' : '出售'
        const _symbol0 = config.modeType === 1 ? baseSymbol : targetSymbol
        const _symbol1 = config.modeType !== 1 ? baseSymbol : targetSymbol

        setLogHandler(`${amountIn} ${_symbol0}${_mode} ${_symbol1}`)

        const { execute } = await raydium.cpmm.swap({
          poolInfo,
          poolKeys,
          swapResult,
          // slippage: Number(config.slippage) / 100, //滑点
          baseIn,
          computeBudgetConfig: {
            // units: 250000,
            microLamports: Number(config.jitoFee) * 1000000,
          },
        });

        const { txId } = await execute({ sendAndConfirm: true });
        transferHash = txId
      }

      const confirmed = await newConnection.confirmTransaction(
        transferHash,
        "processed"
      );
      console.log(confirmed, 'confirmed')
      const isSuccess = confirmed.value.err ? false : true
      setCurrentIndex(walletIndex + 1)
      if (isSuccess) {
        setLogHandler(`交换成功hash: ${transferHash}`, HASH_COLOR, transferHash)

        //手续费
        let tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: owner.publicKey,
            toPubkey: new PublicKey(PROJECT_ADDRESS),
            lamports: SWAP_BOT_FEE * LAMPORTS_PER_SOL,
          })
        )

        try {
          await sendAndConfirmTransaction(connection, tx, [owner]);
        } catch (error) {
          console.log('cccccccwwwwwww')
        }
      } else {
        setLogHandler(`交换失败hash: ${transferHash}`, ERROR_COLOR, transferHash)
      }

    } catch (error) {
      setCurrentIndex(walletIndex + 1)
      const err = (error as any)?.message;
      console.log(error)
      messageApi.error(err)
      setIsStartSwap(false)
      setLogHandler(`意外错误${err},请联系技术人员`, ERROR_COLOR)
    }
  }

  //**pump市值 */
  dotenv.config();
  const pumpStart = async (walletIndex: number) => {
    try {
      let wallet = new NodeWallet(new Keypair()); //note this is not used

      const provider = new AnchorProvider(newConnection, wallet, {
        commitment: "finalized",
      });

      const testAccount = Keypair.fromSecretKey(bs58.decode(privateKeys[walletIndex]));
      setLogHandler(`开始执行（钱包${walletIndex + 1}地址：${addressHandler(testAccount.publicKey.toBase58())}）`)

      let token = config.targetToken
      const mint = new PublicKey(token)

      let sdk = new PumpFunSDK(provider);

      let currentSolBalance = await connection.getBalance(testAccount.publicKey);
      if (currentSolBalance == 0) {
        setLogHandler('余额为0，跳过该钱包')
        return;
      }

      let amountIn = 0
      if (config.amountType === 1) {
        if (token === SOL_TOKEN) {
          amountIn = await printSOLBalance(newConnection, testAccount.publicKey)
        } else {
          amountIn = await getSPLBalance(newConnection, new PublicKey(token), testAccount.publicKey)
        }
      } else if (config.amountType === 2) {
        const min = Number(config.minAmount) * BASE_NUMBER
        const max = Number(config.maxAmount) * BASE_NUMBER
        amountIn = getRandomNumber(min, max) / BASE_NUMBER
      } else {
        amountIn = Number(config.amount)
      }

      //buy 0.0001 SOL worth of tokens
      if (config.modeType === 1) { //购买
        setLogHandler(`花费${amountIn} SOl 购买 ${targetSymbol}`)
        let buyResults = await sdk.buy(
          testAccount, //卖家密钥对
          mint, //铸币账户的公钥
          BigInt(amountIn * LAMPORTS_PER_SOL), //购买的sol数量
          BigInt(Number(config.slippage) * 100), //基础滑点
          {
            unitLimit: 250000,
            unitPrice: Number(config.jitoFee) * 1000000, // 250000= 0.25  1 =0.000001
          },
        );

        if (buyResults.success) {
          setLogHandler(`交换成功hash: ${buyResults.signature}`, HASH_COLOR, buyResults.signature)
        } else {
          setLogHandler(`交换失败hash: ${buyResults.signature}`, ERROR_COLOR, buyResults.signature)
        }
      } else {
        setLogHandler(`出售${amountIn} ${targetSymbol}`)
        let sellResults = await sdk.sell(
          testAccount,
          mint,
          BigInt(amountIn * Math.pow(10, DEFAULT_DECIMALS)),
          BigInt(Number(config.slippage) * 100), //基础滑点
          {
            unitLimit: 250000,
            unitPrice: Number(config.jitoFee) * 1000000, // 250000= 0.25  1 =0.000001
          },
        );
        if (sellResults.success) {
          setLogHandler(`交换成功hash: ${sellResults.signature}`, HASH_COLOR, sellResults.signature)
        } else {
          setLogHandler(`交换失败hash: ${sellResults.signature}`, ERROR_COLOR, sellResults.signature)
        }
      }

      setCurrentIndex(walletIndex + 1)
    } catch (error) {
      const err = (error as any)?.message;
      console.log(error)
      messageApi.error(err)
      setIsStartSwap(false)
      setLogHandler(`意外错误${err},请联系技术人员`, ERROR_COLOR)
    }
  }

  //**pump市值 第二种方法 */
  const pumpStartTwo = async (walletIndex: number) => {
    try {
      console.log(walletIndex, 'walletIndex')
      const testAccount = Keypair.fromSecretKey(bs58.decode(privateKeys[walletIndex]));
      setLogHandler(`开始执行（钱包${walletIndex + 1}地址：${addressHandler(testAccount.publicKey.toBase58())}）`)

      let token = config.targetToken
      const mint = new PublicKey(token)

      let wallet1 = new NodeWallet(new Keypair()); //note this is not used
      const provider = new AnchorProvider(connection, wallet1, {
        commitment: "finalized",
      });
      const program = new Program<PumpFun>(IDL as PumpFun, provider);

      //数量处理
      let currentSolBalance = await connection.getBalance(testAccount.publicKey);
      if (currentSolBalance == 0) {
        setLogHandler('余额为0，跳过该钱包')
        return;
      }
      let amountIn = 0
      if (config.amountType === 1) {
        if (token === SOL_TOKEN) {
          amountIn = await printSOLBalance(newConnection, testAccount.publicKey)
        } else {
          amountIn = await getSPLBalance(newConnection, new PublicKey(token), testAccount.publicKey)
        }
      } else if (config.amountType === 2) {
        const min = Number(config.minAmount) * BASE_NUMBER
        const max = Number(config.maxAmount) * BASE_NUMBER
        amountIn = getRandomNumber(min, max) / BASE_NUMBER
      } else {
        amountIn = Number(config.amount)
      }

      //buy 0.0001 SOL worth of tokens
      if (config.modeType === 1) { //购买
        setLogHandler(`花费${amountIn} SOl 购买 ${targetSymbol}`)
        const buyAmountSol = BigInt(Number(amountIn) * LAMPORTS_PER_SOL)
        let buyTx = await getBuyInstructionsBySolAmount(
          testAccount.publicKey,
          mint,
          buyAmountSol,
          BigInt(Number(config.slippage) * 100),
          program,
          DEFAULT_COMMITMENT
        );
        let newTx = new Transaction()

        const priorityFees = {
          unitLimit: 500000,
          unitPrice: Number(config.jitoFee) * 1000000,
        }
        if (priorityFees) {
          const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
            units: priorityFees.unitLimit,
          });

          const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: priorityFees.unitPrice,
          });
          // newTx.add(modifyComputeUnits);
          // newTx.add(addPriorityFee);
        }

        newTx.add(buyTx)

        newTx.add(
          SystemProgram.transfer({
            fromPubkey: testAccount.publicKey,
            toPubkey: new PublicKey(
              PROJECT_ADDRESS
            ),
            lamports: PUMP_SWAP_BOT_FEE * LAMPORTS_PER_SOL
          }),
        )

        const blockHash = (await connection.getLatestBlockhash(DEFAULT_COMMITMENT))
          .blockhash;

        let messageV0 = new TransactionMessage({
          payerKey: testAccount.publicKey,
          recentBlockhash: blockHash,
          instructions: newTx.instructions,
        }).compileToV0Message();

        let versionedTx = new VersionedTransaction(messageV0);
        versionedTx.sign([testAccount]);
        const sig = await connection.sendTransaction(versionedTx, {
          skipPreflight: false,
        });
        console.log("sig:", `https://solscan.io/tx/${sig}`);
        setLogHandler(`交换成功hash: ${sig}`, HASH_COLOR, sig)

      } else {
        setLogHandler(`出售${amountIn} ${targetSymbol}`)
        const sellTokenAmount = BigInt(amountIn * 1000000)
        let sellTx = await getSellInstructionsByTokenAmount(
          testAccount.publicKey,
          mint,
          sellTokenAmount,
          BigInt(Number(config.slippage) * 100),
          DEFAULT_COMMITMENT,
          program
        );

        let newTx = new Transaction()
        const priorityFees = {
          unitLimit: 500000,
          unitPrice: Number(config.jitoFee) * 1000000,
        }
        if (priorityFees) {
          const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
            units: priorityFees.unitLimit,
          });

          const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: priorityFees.unitPrice,
          });
          // newTx.add(modifyComputeUnits);
          // newTx.add(addPriorityFee);
        }

        newTx.add(sellTx)

        // newTx.add(
        //   SystemProgram.transfer({
        //     fromPubkey: testAccount.publicKey,
        //     toPubkey: new PublicKey(
        //       PROJECT_ADDRESS
        //     ),
        //     lamports: PUMP_SWAP_BOT_FEE * LAMPORTS_PER_SOL
        //   }),
        // )

        const blockHash = (await connection.getLatestBlockhash(DEFAULT_COMMITMENT))
          .blockhash;

        let messageV0 = new TransactionMessage({
          payerKey: testAccount.publicKey,
          recentBlockhash: blockHash,
          instructions: newTx.instructions,
        }).compileToV0Message();

        let versionedTx = new VersionedTransaction(messageV0);
        versionedTx.sign([testAccount]);

        const sig = await connection.sendTransaction(versionedTx, {
          skipPreflight: false,
        });
        console.log("sig:", `https://solscan.io/tx/${sig}`);
        setLogHandler(`交换成功hash: ${sig}`, HASH_COLOR, sig)
      }

      setCurrentIndex((item) => item + 1)

    } catch (error) {
      const err = (error as any)?.message;
      console.log(error)
      messageApi.error(err)
      setIsStartSwap(false)
      setLogHandler(`意外错误${err},请联系技术人员`, ERROR_COLOR)
      setCurrentIndex((item) => item + 1)
    }
  }

  async function getBondingCurveAccount(
    mint: PublicKey,
    program: Program<PumpFun>,
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    const tokenAccount = await connection.getAccountInfo(
      // getBondingCurvePDA(mint),
      PublicKey.findProgramAddressSync(
        [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
        program.programId
      )[0],
      commitment
    );
    if (!tokenAccount) {
      return null;
    }
    return BondingCurveAccount.fromBuffer(tokenAccount!.data);
  }
  async function getGlobalAccount(commitment: Commitment = DEFAULT_COMMITMENT) {
    const [globalAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_ACCOUNT_SEED)],
      new PublicKey(PROGRAM_ID)
    );

    const tokenAccount = await connection.getAccountInfo(
      globalAccountPDA,
      commitment
    );

    return GlobalAccount.fromBuffer(tokenAccount!.data);
  }
  //buy
  async function getBuyInstructions(
    buyer: PublicKey,
    mint: PublicKey,
    feeRecipient: PublicKey,
    amount: bigint,
    solAmount: bigint,
    program: Program<PumpFun>,
    commitment: Commitment = DEFAULT_COMMITMENT,
  ) {
    return new Promise(async (resolve: (value: Transaction) => void, reject) => {
      try {
        const associatedBondingCurve = await getAssociatedTokenAddress(
          mint,
          // this.getBondingCurvePDA(mint),
          PublicKey.findProgramAddressSync(
            [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
            program.programId
          )[0],
          true
        );

        const associatedUser = await getAssociatedTokenAddress(mint, buyer, false);

        let transaction = new Transaction();

        try {
          await getAccount(connection, associatedUser, commitment);
        } catch (e) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              buyer,
              associatedUser,
              buyer,
              mint
            )
          );
        }

        transaction.add(
          await program.methods
            .buy(new BN(amount.toString()), new BN(solAmount.toString()))
            .accounts({
              feeRecipient: feeRecipient,
              mint: mint,
              associatedBondingCurve: associatedBondingCurve,
              associatedUser: associatedUser,
              user: buyer,
            })
            .transaction()
        );
        resolve(transaction)
      } catch (error) {
        reject(error)
      }

    })
  }
  async function getSellInstructions(
    seller: PublicKey,
    mint: PublicKey,
    feeRecipient: PublicKey,
    amount: bigint,
    minSolOutput: bigint,
    program: Program<PumpFun>,
  ) {
    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      // this.getBondingCurvePDA(mint),
      PublicKey.findProgramAddressSync(
        [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
        program.programId
      )[0],
      true
    );

    const associatedUser = await getAssociatedTokenAddress(mint, seller, false);

    let transaction = new Transaction();

    transaction.add(
      await program.methods
        .sell(new BN(amount.toString()), new BN(minSolOutput.toString()))
        .accounts({
          feeRecipient: feeRecipient,
          mint: mint,
          associatedBondingCurve: associatedBondingCurve,
          associatedUser: associatedUser,
          user: seller,
        })
        .transaction()
    );

    return transaction;
  }
  //sell
  async function getSellInstructionsByTokenAmount(
    seller: PublicKey,
    mint: PublicKey,
    sellTokenAmount: bigint,
    slippageBasisPoints: bigint = 500n,
    commitment: Commitment = DEFAULT_COMMITMENT,
    program: Program<PumpFun>,
  ) {
    let bondingCurveAccount = await getBondingCurveAccount(
      mint,
      program,
      commitment
    );
    if (!bondingCurveAccount) {
      setLogHandler(`Bonding curve account not found: ${mint.toBase58()}`, ERROR_COLOR)
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    let globalAccount = await getGlobalAccount(commitment);

    let minSolOutput = bondingCurveAccount.getSellPrice(
      sellTokenAmount,
      globalAccount.feeBasisPoints
    );

    let sellAmountWithSlippage = calculateWithSlippageSell(
      minSolOutput,
      slippageBasisPoints
    );

    return await getSellInstructions(
      seller,
      mint,
      globalAccount.feeRecipient,
      sellTokenAmount,
      sellAmountWithSlippage,
      program
    );
  }
  async function getBuyInstructionsBySolAmount(
    buyer: PublicKey,
    mint: PublicKey,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = 500n,
    program: Program<PumpFun>,
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    let bondingCurveAccount = await getBondingCurveAccount(
      mint,
      program,
      commitment
    );
    if (!bondingCurveAccount) {
      setLogHandler(`Bonding curve account not found: ${mint.toBase58()}`, ERROR_COLOR)
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    let buyAmount = bondingCurveAccount.getBuyPrice(buyAmountSol);
    let buyAmountWithSlippage = calculateWithSlippageBuy(
      buyAmountSol,
      slippageBasisPoints
    );

    let globalAccount = await getGlobalAccount(commitment);

    return await getBuyInstructions(
      buyer,
      mint,
      globalAccount.feeRecipient,
      buyAmount,
      buyAmountWithSlippage,
      program
    );
  }

  const buy = async () => {
    try {

      const mint = new PublicKey('WRqtv49wmt38mbb7ZXfNU66mUVyEzbMtZMivmSGAXJA')
      const testAccount = Keypair.fromSecretKey(bs58.decode('5kG2UFoyFvFJ6M7mNFfCvYgRvy4QW7K6qRzGaJb9ZJ87jmnB3cEjy6BPyqMvqUDFmvrpzRmBVuNWukCUyYf49h8T'));

      let wallet1 = new NodeWallet(new Keypair()); //note this is not used
      const provider = new AnchorProvider(connection, wallet1, {
        commitment: "finalized",
      });
      const program = new Program<PumpFun>(IDL as PumpFun, provider);

      const buyAmountSol = BigInt(0.0001 * LAMPORTS_PER_SOL)

      let buyTx = await getBuyInstructionsBySolAmount(
        testAccount.publicKey,
        mint,
        buyAmountSol,
        500n,
        program,
        DEFAULT_COMMITMENT
      );
      let newTx = new Transaction()
      newTx.add(buyTx)


      const blockHash = (await connection.getLatestBlockhash(DEFAULT_COMMITMENT))
        .blockhash;

      let messageV0 = new TransactionMessage({
        payerKey: testAccount.publicKey,
        recentBlockhash: blockHash,
        instructions: newTx.instructions,
      }).compileToV0Message();

      let versionedTx = new VersionedTransaction(messageV0);
      versionedTx.sign([testAccount]);
      const sig = await connection.sendTransaction(versionedTx, {
        skipPreflight: false,
      });
      console.log("sig:", `https://solscan.io/tx/${sig}`);
    } catch (error) {
      console.log(error)
    }
  }

  const sell = async () => {
    try {
      const mint = new PublicKey('WRqtv49wmt38mbb7ZXfNU66mUVyEzbMtZMivmSGAXJA')
      const testAccount = Keypair.fromSecretKey(bs58.decode('5kG2UFoyFvFJ6M7mNFfCvYgRvy4QW7K6qRzGaJb9ZJ87jmnB3cEjy6BPyqMvqUDFmvrpzRmBVuNWukCUyYf49h8T'));

      let wallet1 = new NodeWallet(new Keypair()); //note this is not used
      const provider = new AnchorProvider(connection, wallet1, {
        commitment: "finalized",
      });
      const program = new Program<PumpFun>(IDL as PumpFun, provider);

      const sellTokenAmount = BigInt(10 * 1000000)

      let sellTx = await getSellInstructionsByTokenAmount(
        testAccount.publicKey,
        mint,
        sellTokenAmount,
        500n,
        DEFAULT_COMMITMENT,
        program
      );

      let newTx = new Transaction()
      newTx.add(sellTx)

      const blockHash = (await connection.getLatestBlockhash(DEFAULT_COMMITMENT))
        .blockhash;

      let messageV0 = new TransactionMessage({
        payerKey: testAccount.publicKey,
        recentBlockhash: blockHash,
        instructions: newTx.instructions,
      }).compileToV0Message();

      let versionedTx = new VersionedTransaction(messageV0);
      versionedTx.sign([testAccount]);

      const sig = await connection.sendTransaction(versionedTx, {
        skipPreflight: false,
      });
      console.log("sig:", `https://solscan.io/tx/${sig}`);

    } catch (error) {
      console.log(error)
    }
  }

  return (
    <SwapBot>
      {contextHolder}
      <div className='swappage'>
        <Header title={t('Market-Making-Bot')} />


        <div className='segmentd'>
          <Segmented options={[t('Raydium Market Cap Management'), t('Pump market value management')]}
            value={transferType} onChange={setTransferType}
            size='large' />
        </div>

        <div className='buttonSwapper mt-3 flex'>
          <PrivateKeyPage privateKeys={privateKeys} callBack={privateKeyCallBack} />
          <Button className={Button_Style} onClick={updataWallet} type='primary'>{t('Refresh wallet')}</Button>
        </div>
        <div className='flex mt-3 wallet_item'>
          <div className='w-1/5 text-center'>{t('Address')}</div>
          <div className='w-1/5 text-center'>sol{t('Balance')}</div>
          <div className='w-1/5 text-center'>{t('Base Token')}Sol</div>
          <div className='w-1/5 text-center'>{t('target token')}</div>
          <div className='w-1/5 text-center'>{t('operate')}</div>
        </div>

        <div className='swap_wallet'>
          {addressArr.map((item, index) => (
            <div className='flex wallet_item' key={index}>
              <div className='w-1/5 text-center'>{addressHandler(item)}</div>
              <div className='w-1/5 text-center'>{walletsArrInfo[index] && walletsArrInfo[index].solBalance || '0'}</div>
              <div className='w-1/5 text-center'>{walletsArrInfo[index] && walletsArrInfo[index].baseTokenBlance || '0'}</div>
              <div className='w-1/5 text-center'>{walletsArrInfo[index] && walletsArrInfo[index].targetTokenBalance || '0'}</div>
              <div className='w-1/5 text-center' onClick={() => deleteClick(index)}>
                <DeleteOutlined />
              </div>
            </div>
          ))}
        </div>
        {/* 代币 */}
        <div className='flex items-center justify-between'>
          <div className='swap_w'>
            <div className='flex items-center mb-2'>
              <div className='font-bold'>{t('Base Token')}</div>
              <div className='ml-2'>({t('value coin')})</div>
            </div>
          </div>
          <div className='swap_w'>
            <div className='flex items-center mb-2'>
              <div className='font-bold'>{t('target token')}</div>
              <div className='ml-2'>({t('Dogecoin')})</div>
            </div>
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <SelectToken callBack={baseTokenChange} isBase={true} isPump={transferType === t('Pump market value management')} />
          <div className='flex items-center'>
            <ArrowRightOutlined />
          </div>
          <SelectToken isUSDC={true} callBack={targetTokenChange} />
        </div>

        {/* RPC */}
        <div className='flex items-center mt-5 mb-1'>
          <div className='font-bold'>RPC:</div>
          <div>({t('The default rpc is public. If you need smoother transactions, please enter your rpc.')})</div>
        </div>
        <input className={Input_Style} placeholder={t('Using default rpc')} value={config.rpc} onChange={configChange} name='rpc' />

        <div className='mt-5 flex items-center'>
          <div>{t('model')}：</div>
          <Radio.Group onChange={modeTypeChange} value={config.modeType}>
            <Radio value={1}>{t('pull plate')}</Radio>
            <Radio value={2}>{t('Smash the plate')}</Radio>
          </Radio.Group>
        </div>

        <div className='mt-5 flex items-center m_swap'>
          <div>{t('Amount')}：</div>
          <Radio.Group onChange={amountTypeChange} value={config.amountType}>
            <Radio value={1}>{t('All')}</Radio>
            <Radio value={2}>{t('Random')}</Radio>
            <Radio value={3}>{t('Fixed')}</Radio>
          </Radio.Group>
          {config.amountType === 2 &&
            <div className='flex items-center'>
              <div className='w-32'>
                <input className={`${Input_Style}`} value={config.minAmount} onChange={configChange} name='minAmount' />
              </div>
              <div className='mx-2 font-bold'>~</div>
              <div className='w-32'>
                <input className={`${Input_Style}`} value={config.maxAmount} onChange={configChange} name='maxAmount' />
              </div>
            </div>
          }
          {config.amountType === 3 &&
            <input className={`${Input_Style} flex-1`} value={config.amount} onChange={configChange} name='amount' />
          }
        </div>

        {transferType === t('Raydium Market Cap Management') &&
          <div className='flex items-center mt-5'>
            <div className='mr-2'>{t('Pool type')}:</div>
            <div className='flex'>
              <div className={`swap_btn ${config.poolType === 1 && 'btnActive'}`} onClick={() => poolTypeChange(1)}>RaydiumV2</div>
              <div className={`swap_btn ml-2 ${config.poolType === 2 && 'btnActive'}`} onClick={() => poolTypeChange(2)}>RaydiumV3</div>
            </div>
          </div>
        }

        <div className='flex items-center mt-5'>
          <div>{t('Interval (seconds)')}:</div>
          <div className='flex items-center ml-2'>
            <div className=''>
              <input className={Input_Style} value={config.minTime} onChange={configChange} name='minTime' />
            </div>
            <div className='mx-2 font-bold'>~</div>
            <div className=''>
              <input className={Input_Style} value={config.maxTime} onChange={configChange} name='maxTime' />
            </div>
          </div>
        </div>

        <div className='mt-5 flex items-center'>
          <div className='mr-2'>{t('Slippage')}(%):</div>
          <div className=''>
            <input className={Input_Style} value={config.slippage} onChange={configChange} name='slippage' />
          </div>
        </div>

        <div className='mt-5 flex items-center'>
          <div className='mr-2'>{t('Loop execution rounds')}:</div>
          <div className=''>
            <input className={Input_Style} value={config.loop} onChange={configChange} name='loop' />
          </div>
        </div>
        <div className='text-sm text-rose-700'>{t('Refers to the total number of rounds executed by the addresses in the list')}</div>


        <div className='mt-5 flex items-center m_swap'>
          <div>{t('Jito tip')}：</div>
          <div className='flex mr-5'>
            <div className={`swap_btn ${config.jitoType === 1 && 'btnActive'}`} onClick={() => jitoTypeChange(1)}>{t('default')}</div>
            <div className={`swap_btn ml-2 ${config.jitoType === 2 && 'btnActive'}`} onClick={() => jitoTypeChange(2)}>{t('fast')}</div>
            <div className={`swap_btn ml-2 ${config.jitoType === 3 && 'btnActive'}`} onClick={() => jitoTypeChange(3)}>{t('super fast')}</div>
          </div>
          <div>
            <input className={`${Input_Style} flex-1`} value={config.jitoFee} onChange={configChange} name='jitoFee' />
          </div>
        </div>

        <div className='buttonSwapper flex mt-5'>
          {transferType === t('Raydium Market Cap Management') &&
            <Button className={Button_Style} onClick={getPoolAddress}>{t('Find a pool')}</Button>
          }
          <Button className={Button_Style} onClick={start}
            loading={isStartSwap}>{t('Start')}</Button>
          <Button className={Button_Style} onClick={stopSwap}>{t('Stop')}</Button>
          <Button className={Button_Style} onClick={cleanLog}>{t('Clear log')}</Button>
        </div>
        {transferType === t('Raydium Market Cap Management') &&
          <div className='text-sm text-rose-700'>{t('Please click to find a pool first, then click to start')}</div>
        }

        <div className="logswapper mt-5">
          {[...logsArr].reverse().map((item: Test, index) => (
            <div key={index} className='flex'>
              <div className='logs_time'>
                <span >{item.time}</span>
                {
                  item.isHash ?
                    <a href={getTxLink(item.isHash)} target='_blank' style={{ color: item.color }}>
                      <span className='ml-1'>{item.data}</span>
                    </a>
                    : <span className='ml-1' style={{ color: item.color }}>{item.data}</span>
                }
              </div>
            </div>
          ))}
        </div >
      </div>

    </SwapBot>

  )
}

export default Swapbot