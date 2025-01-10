import { useState } from 'react'
import { Input, Switch, DatePicker, Button, notification, Space } from 'antd'
import type { DatePickerProps } from 'antd';
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  ACCOUNT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeAccountInstruction,
  MintLayout
} from '@solana/spl-token'
import {
  MARKET_STATE_LAYOUT_V3,
  AMM_V4,
  OPEN_BOOK_PROGRAM,
  FEE_DESTINATION_ID,
  DEVNET_PROGRAM_ID,
  TxVersion,
  AmmRpcData,
  AmmV4Keys,
  ApiV3PoolInfoStandardItem,
} from '@raydium-io/raydium-sdk-v2'
import * as BufferLayout from 'buffer-layout';
import BN from 'bn.js'
import { initSdk } from '@/Dex/Raydium'
import { Input_Style, Button_Style, OPENBOOK_PROGRAM_ID, CREATE_POOL_FEE, BANANATOOLS_ADDRESS, isMainnet } from '@/config'
import { Page } from '@/styles'
import { getTxLink, addPriorityFees } from '@/utils'
import { SOL, PUMP } from '@/config/Token'
import type { Token_Type } from '@/type'
import { Header, SelectToken, Result } from '@/components'
import DatePage from './DatePage'
import { CreatePool } from './style'

function CreateLiquidity() {
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();

  const [baseToken, setBaseToken] = useState<Token_Type>(SOL)
  const [token, setToken] = useState<Token_Type>(PUMP)
  const [isOptions, setIsOptions] = useState(false)
  const [isCreate, setIsCreate] = useState(false)
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');
  const [poolAddr, setPoolAddr] = useState('')
  const [isSearchId, setIsSearchId] = useState(false)

  const [config, setConfig] = useState({
    marketId: '',
    baseAmount: '',
    quoteAmount: '',
    startTime: ''
  })
  const configChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }
  const baseChange = (_token: Token_Type) => {
    setBaseToken(_token)
  }
  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }
  const timeOnChange: DatePickerProps['onChange'] = (date, dateString) => {
    const time = Date.parse(dateString as string) / 1000
    setConfig({ ...config, startTime: time.toString() })
  };

  const ACCOUNT_LAYOUT = BufferLayout.struct([
    BufferLayout.blob(53, 'mint'),
    BufferLayout.blob(32, 'owner'),
    BufferLayout.blob(85, 'base'),
    BufferLayout.nu64('amount'),
    BufferLayout.blob(93),
  ]);
  const findMarketId = async () => {
    try {
      setIsSearchId(true)
      const result = await connection.getProgramAccounts(new PublicKey(OPENBOOK_PROGRAM_ID), {
        filters: [
          {
            memcmp: {
              offset: ACCOUNT_LAYOUT.offsetOf('owner'),
              bytes: baseToken.address,
            },
          },
          {
            memcmp: {
              offset: ACCOUNT_LAYOUT.offsetOf('base'),
              bytes: token.address,
            },
          },
        ]
      });
      if (result.length > 0) {
        const marketId = result[0].pubkey.toBase58()
        setConfig({ ...config, marketId })
        api.success({ message: "查找成功" })
      } else {
        api.success({ message: "没有查找到ID" })
      }
      setIsSearchId(false)
    } catch (error) {
      console.log(error)
      api.error({ message: error.toString() })
      setIsSearchId(false)
    }
  }

  const createClick = async () => {
    try {
      if (!token) return api.error({ message: "请选择代币" })
      if (!config.marketId) return api.error({ message: "请填写市场ID" })
      if (!config.baseAmount) return api.error({ message: "请填写基础代币数量" })
      if (!config.quoteAmount) return api.error({ message: "请填写报价代币数量" })

      setIsCreate(true)
      let startTime = new BN(0)
      if (isOptions && config.startTime) {
        startTime = new BN(config.startTime)
      }
      const raydium = await initSdk({
        owner: publicKey,
        connection: connection,
      });

      const marketId = new PublicKey(config.marketId)
      // if you are confirmed your market info, don't have to get market info from rpc below
      const marketBufferInfo = await raydium.connection.getAccountInfo(new PublicKey(marketId))
      const marketData = MARKET_STATE_LAYOUT_V3.decode(marketBufferInfo!.data)
      const { baseMint, quoteMint } = MARKET_STATE_LAYOUT_V3.decode(marketBufferInfo!.data)
      const txVersion = TxVersion.V0 // or TxVersion.LEGACY
      const baseAmount = new BN(Number(config.baseAmount) * (10 ** baseToken.decimals))
      const quoteAmount = new BN(Number(config.quoteAmount) * (10 ** token.decimals))

      const execute = await raydium.liquidity.createPoolV4({
        programId: isMainnet ? AMM_V4 : DEVNET_PROGRAM_ID.AmmV4,
        marketInfo: {
          marketId,
          programId: isMainnet ? OPEN_BOOK_PROGRAM : DEVNET_PROGRAM_ID.OPENBOOK_MARKET,
        },
        baseMintInfo: {
          mint: baseMint,
          decimals: baseToken.decimals, // if you know mint decimals here, can pass number directly
        },
        quoteMintInfo: {
          mint: quoteMint,
          decimals: token.decimals, // if you know mint decimals here, can pass number directly
        },
        baseAmount, // if devent pool with sol/wsol, better use amount >= 4*10**9
        quoteAmount, // if devent pool with sol/wsol, better use amount >= 4*10**9
        startTime, // unit in seconds
        ownerInfo: {
          feePayer: publicKey,
          useSOLBalance: true,
        },
        associatedOnly: false,
        txVersion,
        checkCreateATAOwner: true,
        feeDestinationId: isMainnet ? FEE_DESTINATION_ID : DEVNET_PROGRAM_ID.FEE_DESTINATION_ID, // devnet
        // optional: set up priority fee here
        // computeBudgetConfig: {
        //   units: 600000,
        //   microLamports: 4659150,
        // },
      })
      const poolId = execute.extInfo.address.ammId.toBase58()
      const Tx = execute.transaction;

      //增加费用，减少失败
      // const versionedTx = await addPriorityFees(connection, Tx, publicKey)
      const signature = await sendTransaction(Tx, connection);
      const confirmed = await connection.confirmTransaction(
        signature,
        "processed"
      );
      setSignature(signature)
      setPoolAddr(poolId)
      console.log("confirmation", signature);
      setIsCreate(false);
      api.success({ message: 'create pool success' })
    } catch (error) {
      console.log(error)
      api.error({ message: error.toString() })
      setIsCreate(false);
    }
  }

  return (
    <Page>
      {contextHolder1}
      <Header title='创建流动性池' hint='轻松创建任何 Solana 代币的流动资金池。您的代币将可在 Raydium、Birdeye 和 DexScreener 上进行交易。' />
      <CreatePool>
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

        <div className='mt-5'>
          <div className='flex mb-1 justify-between'>
            <div>OpenBook市场 ID(没有？去创建)</div>
            <Button type='primary' onClick={findMarketId} loading={isSearchId}>查找Market ID</Button>
          </div>
          <div>
            <Input className={Input_Style} value={config.marketId} onChange={configChange} name='marketId' />
          </div>
        </div>

        <div className='token mt-5'>
          <div className='tokenItem mr-5'>
            <div className='mb-1 start'>基础代币数量</div>
            <Input className={Input_Style} type='number' value={config.baseAmount} onChange={configChange} name='baseAmount' />
          </div>
          <div className='tokenItem'>
            <div className='mb-1 start'>报价代币数量</div>
            <Input className={Input_Style} type='number' value={config.quoteAmount} onChange={configChange} name='quoteAmount' />
          </div>
        </div>


        <div className='flex items-center mt-5 options'>
          <div className='mr-3 mb-2'>开盘时间</div>
          <Switch checked={isOptions} onChange={(e) => setIsOptions(e)} />
        </div>
        {isOptions &&
          <>
            <Space direction="vertical" size={12}>
              <DatePicker showTime onChange={timeOnChange} size='large' />
            </Space>
          </>
        }

        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={createClick} loading={isCreate}>创建</Button>
          </div>
          <div className='fee'>全网最低服务费: {CREATE_POOL_FEE} SOL</div>
        </div>

        <Result tokenAddress={poolAddr} signature={signature} error={error} />
      </CreatePool>

    </Page>
  )
}

export default CreateLiquidity