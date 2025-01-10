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
import * as BufferLayout from 'buffer-layout';
import BN from 'bn.js'
import { Input_Style, Button_Style, OPENBOOK_PROGRAM_ID, CREATE_POOL_FEE, BANANATOOLS_ADDRESS } from '@/config'
import { Page } from '@/styles'
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
      const startTime = new BN(Math.trunc(Date.now() / 1000) - 4)

    } catch (error) {
      console.log(error)
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