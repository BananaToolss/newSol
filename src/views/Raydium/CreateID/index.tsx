import { useState } from 'react'
import { Input, Switch, Segmented, Button, notification } from 'antd'
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  ACCOUNT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeAccountInstruction,
  MintLayout
} from '@solana/spl-token'
import { ZERO } from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js'
import { DexInstructions, Market } from "@project-serum/serum";
import { Header, SelectToken, Hint, Result } from '@/components'
import { useIsVip } from '@/hooks';
import { getTxLink, addPriorityFees } from '@/utils'
import { SOL, PUMP } from '@/config/Token'
import { Input_Style, Button_Style, MARKET_FEE, BANANATOOLS_ADDRESS } from '@/config'
import { Page } from '@/styles'
import { useConfig } from '@/hooks';
import type { Token_Type } from '@/type'
import {
  EVENT_QUEUE_LENGTH,
  EVENT_QUEUE_LENGTH_MIDDLE,
  EVENT_QUEUE_LENGTH_MINI,
  ORDERBOOK_LENGTH,
  ORDERBOOK_LENGTH_MIDDLE,
  ORDERBOOK_LENGTH_MINI,
  REQUEST_QUEUE_LENGTH,
  REQUEST_QUEUE_LENGTH_MIDDLE,
  REQUEST_QUEUE_LENGTH_MINI,
  getVaultOwnerAndNonce
} from './orderbookUtils'
import useSerumMarketAccountSizes from './getMarketAccountSizes'
import { CreateIDPage } from './style'

const OPTIONS = [
  { label: '低配0.29 SOL', value: 0 },
  { label: '中配1.4 SOL', value: 1 },
  { label: '高配2.7 SOL', value: 2 },
]
const initialOptions = [
  {
    event: EVENT_QUEUE_LENGTH_MINI,
    request: REQUEST_QUEUE_LENGTH_MINI,
    order: ORDERBOOK_LENGTH_MINI,
  },
  {
    event: EVENT_QUEUE_LENGTH_MIDDLE,
    request: REQUEST_QUEUE_LENGTH_MIDDLE,
    order: ORDERBOOK_LENGTH_MIDDLE,
  },
  {
    event: EVENT_QUEUE_LENGTH,
    request: REQUEST_QUEUE_LENGTH,
    order: ORDERBOOK_LENGTH,
  },
];

function CreateID() {

  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const vipConfig = useIsVip()
  const { OPENBOOK_PROGRAM_ID } = useConfig()
  const [baseToken, setBaseToken] = useState<Token_Type>(PUMP)
  const [token, setToken] = useState<Token_Type>(SOL)
  const [isOptions, setIsOptions] = useState(false)
  const [level, setLevel] = useState(0)
  const [isCreate, setIsCreate] = useState(false)
  const [marketId, setMarketId] = useState('')
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');

  const [config, setConfig] = useState({
    minBuy: '1',
    minPrice: '0.000001',
    eventLength: initialOptions[0].event,
    requestLength: initialOptions[0].request,
    orderLength: initialOptions[0].order,
  })

  const baseChange = (_token: Token_Type) => {
    setBaseToken(_token)
  }
  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }
  const levelChange = (e: number) => {
    setLevel(e)
    setConfig({
      ...config,
      eventLength: initialOptions[e].event,
      requestLength: initialOptions[e].request,
      orderLength: initialOptions[e].order,
    })
  }
  const configChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }

  const createClick = async () => {
    try {
      setSignature('')
      setError('')
      setMarketId('')
      if (!baseToken) return api.error({ message: "请选择基础代币" })
      if (!token) return api.error({ message: "请选择报价代币" })
      if (Number(config.minBuy) < 0) return api.error({ message: "请填写订单量" })
      if (Number(config.minPrice) < 0) return api.error({ message: "请填写变动单位" })
      if (Number(config.eventLength) < 0) return api.error({ message: "请填写事件队列长度" })
      if (Number(config.requestLength) < 0) return api.error({ message: "请填写请求队列长度" })
      if (Number(config.orderLength) < 0) return api.error({ message: "请填写Orderbook长度" })

      setIsCreate(true)
      const programID = new PublicKey(OPENBOOK_PROGRAM_ID)
      const baseMint = new PublicKey(baseToken.address)
      const quoteMint = new PublicKey(token.address)
      //创建市场账户
      const marketAccounts = {
        market: Keypair.generate(),
        requestQueue: Keypair.generate(),
        eventQueue: Keypair.generate(),
        bids: Keypair.generate(),
        asks: Keypair.generate(),
        baseVault: Keypair.generate(),
        quoteVault: Keypair.generate(),
      };
      // 获取保险库的所有者和随机数
      const [vaultOwner, vaultOwnerNonce] = await getVaultOwnerAndNonce(
        marketAccounts.market.publicKey,
        programID
      );
      //创建保险账号
      const vaultInstruction1 = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: marketAccounts.baseVault.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(
          ACCOUNT_SIZE
        ),
        space: ACCOUNT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      });
      const vaultInstruction2 = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: marketAccounts.quoteVault.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(
          ACCOUNT_SIZE
        ),
        space: ACCOUNT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      });
      const vaultInstruction3 = createInitializeAccountInstruction(
        marketAccounts.baseVault.publicKey,
        baseMint,
        vaultOwner
      );
      const vaultInstruction4 = createInitializeAccountInstruction(
        marketAccounts.quoteVault.publicKey,
        quoteMint,
        vaultOwner
      );
      //完成第一次交易
      const Tx = new Transaction().add(
        vaultInstruction1,
        vaultInstruction2,
        vaultInstruction3,
        vaultInstruction4,
      );
      //增加费用，减少失败
      const versionedTx = await addPriorityFees(connection, Tx, publicKey)
      versionedTx.sign([marketAccounts.baseVault, marketAccounts.quoteVault])
      const signature = await sendTransaction(versionedTx, connection);
      const confirmed = await connection.confirmTransaction(
        signature,
        "processed"
      );
      console.log(getTxLink(signature))
      const [baseMintAccountInfo, quoteMintAccountInfo] = await connection.getMultipleAccountsInfo([baseMint, quoteMint])
      let baseMintDecimals: number;
      let quoteMintDecimals: number;
      if (!baseMintAccountInfo || !quoteMintAccountInfo) return api.error({ message: "Invalid token address! Token not found" })
      try {
        baseMintDecimals = MintLayout.decode(baseMintAccountInfo.data).decimals
        quoteMintDecimals = MintLayout.decode(quoteMintAccountInfo.data).decimals
      } catch (error) {
        return api.error({ message: "Invalid token address! Token not found" })
      }

      const lotSize = Number(config.minBuy) // 1
      const tickSize = Number(config.minPrice) //0.01
      // 计算基准和报价的lotSize和tickSize
      const baseLotSize = new BN(Math.round(10 ** baseMintDecimals * lotSize))
      const quoteLotSize = new BN(Math.round(lotSize * 10 ** quoteMintDecimals * tickSize))
      if (baseLotSize.eq(ZERO)) return api.error({ message: 'lot size is too small' })
      if (quoteLotSize.eq(ZERO)) return api.error({ message: 'tick size or lot size is too small' })
      // 创建市场账户
      const marketInstruction1 = SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.market.publicKey,
        fromPubkey: publicKey,
        space: Market.getLayout(programID).span,
        lamports: await connection.getMinimumBalanceForRentExemption(
          Market.getLayout(programID).span
        ),
        programId: programID,
      });
      const {
        totalEventQueueSize,
        totalOrderbookSize,
        totalRequestQueueSize,
      } = useSerumMarketAccountSizes({
        eventQueueLength: Number(config.eventLength),
        requestQueueLength: Number(config.requestLength),
        orderbookLength: Number(config.orderLength),
      });
      // 创建请求队列账户
      const marketInstruction2 = SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.requestQueue.publicKey,
        fromPubkey: publicKey,
        space: totalRequestQueueSize,
        lamports: await connection.getMinimumBalanceForRentExemption(
          totalRequestQueueSize
        ),
        programId: programID,
      });
      // 创建事件队列账户
      const marketInstruction3 = SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.eventQueue.publicKey,
        fromPubkey: publicKey,
        space: totalEventQueueSize,
        lamports: await connection.getMinimumBalanceForRentExemption(
          totalEventQueueSize
        ),
        programId: programID,
      });
      const orderBookRentExempt =
        await connection.getMinimumBalanceForRentExemption(totalOrderbookSize);

      // 创建买单
      const marketInstruction4 = SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.bids.publicKey,
        fromPubkey: publicKey,
        space: totalOrderbookSize,
        lamports: orderBookRentExempt,
        programId: programID,
      });
      // 创建卖单
      const marketInstruction5 = SystemProgram.createAccount({
        newAccountPubkey: marketAccounts.asks.publicKey,
        fromPubkey: publicKey,
        space: totalOrderbookSize,
        lamports: orderBookRentExempt,
        programId: programID,
      });

      //创建市场
      const marketInstruction6 = DexInstructions.initializeMarket({
        market: marketAccounts.market.publicKey,
        requestQueue: marketAccounts.requestQueue.publicKey,
        eventQueue: marketAccounts.eventQueue.publicKey,
        bids: marketAccounts.bids.publicKey,
        asks: marketAccounts.asks.publicKey,
        baseVault: marketAccounts.baseVault.publicKey,
        quoteVault: marketAccounts.quoteVault.publicKey,
        baseMint,
        quoteMint,
        baseLotSize,
        quoteLotSize,
        feeRateBps: 150, // Unused in v3
        quoteDustThreshold: new BN(500), // Unused in v3
        vaultSignerNonce: vaultOwnerNonce,
        programId: programID,
      });

      const fee = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
        lamports: MARKET_FEE * LAMPORTS_PER_SOL,
      })

      const newTx = new Transaction().add(
        marketInstruction1,
        marketInstruction2,
        marketInstruction3,
        marketInstruction4,
        marketInstruction5,
        marketInstruction6,
      );
      if (!vipConfig.isVip) {
        newTx.add(fee)
      }
      //增加费用，减少失败
      // const versionedTx1 = await addPriorityFees(connection, newTx, publicKey)
      // versionedTx1.sign([
      //   marketAccounts.market,
      //   marketAccounts.requestQueue,
      //   marketAccounts.eventQueue,
      //   marketAccounts.bids,
      //   marketAccounts.asks,
      // ])
      const signature1 = await sendTransaction(newTx, connection, {
        signers: [
          marketAccounts.market,
          marketAccounts.requestQueue,
          marketAccounts.eventQueue,
          marketAccounts.bids,
          marketAccounts.asks,
        ]
      });
      const confirmed1 = await connection.confirmTransaction(
        signature1,
        "processed"
      );
      console.log(confirmed1, 'confirmed1')
      api.success({ message: '创建成功' })
      setIsCreate(false)
      setSignature(signature1)
      setMarketId(marketAccounts.market.publicKey.toBase58())
    } catch (error) {
      console.log(error)
      api.error({ message: error.toString() })
      setIsCreate(false)
      const err = (error as any)?.message;
      if (
        err.includes(
          "Cannot read properties of undefined (reading 'public_keys')"
        )
      ) {
        setError("It is not a valid Backpack username");
      } else {
        setError(err);
      }
    }
  }

  return (
    <Page>
      {contextHolder1}
      <Header title='创建市场ID' hint='创建一个Raydium市场ID,这是添加Raydium AMM流动性池的必要条件' />
      <CreateIDPage>
        <div className='token'>
          <div className='tokenItem mr-5'>
            <div className='mb-1 start'>基础代币</div>
            <SelectToken selecToken={baseToken} callBack={baseChange} />
          </div>
          <div className='tokenItem'>
            <div className='mb-1 start'>报价代币</div>
            <SelectToken selecToken={token} callBack={backClick} />
          </div>
        </div>

        <div className='token mt-5'>
          <div className='tokenItem mr-5'>
            <div className='mb-1 start'>最小订单量(最小购买量)</div>
            <Input className={Input_Style} type='number' value={config.minBuy} onChange={configChange} name='minBuy' />
          </div>
          <div className='tokenItem'>
            <div className='mb-1 start'>变动单位(最小价格变动)</div>
            <Input className={Input_Style} type='number' value={config.minPrice} onChange={configChange} name='minPrice' />
          </div>
        </div>

        <div className='mt-5'>
          <div className='mb-1'>配置费用</div>
          <Segmented options={[...OPTIONS]} size='large' value={level} onChange={levelChange} />
        </div>

        <div className='flex items-center mt-5 options'>
          <div className='mr-3'>配置详情</div>
          <Switch checked={isOptions} onChange={(e) => setIsOptions(e)} />
        </div>
        {isOptions &&
          <div className='token mt-5'>
            <div className='tokenItem mr-5'>
              <div className='start mb-1'>事件队列长度</div>
              <Input className={Input_Style} type='number' value={config.eventLength} onChange={configChange} name='eventLength' />
            </div>
            <div className='tokenItem mr-5'>
              <div className='start mb-1'>请求队列长度</div>
              <Input className={Input_Style} type='number' value={config.requestLength} onChange={configChange} name='requestLength' />
            </div>
            <div className='tokenItem'>
              <div className='start mb-1'>Orderbook长度</div>
              <Input className={Input_Style} type='number' value={config.orderLength} onChange={configChange} name='orderLength' />
            </div>
          </div>
        }

        <Hint title={`在创建OpenBook ID时，您需要完成两次签名操作：首先生成市场信息，然后才能创建市场。第二次签名会利用第一次生成的信息，因此执行过程可能受本地网络状况影响。
如果操作持续失败，请考虑切换到一个更稳定的网络连接或启用VPN的全局模式再尝试进行操作。`} showClose />

        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={createClick} loading={isCreate}>确认创建</Button>
          </div>
          <div className='fee'>全网最低服务费: {vipConfig.isVip ? 0 : MARKET_FEE} SOL</div>
        </div>

        <Result tokenAddress={marketId} signature={signature} error={error} />
      </CreateIDPage>
    </Page>
  )
}

export default CreateID