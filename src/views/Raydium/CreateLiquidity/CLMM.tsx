import { useState } from 'react'
import { Input, Switch, DatePicker, Button, notification, Space, Segmented } from 'antd'
import type { DatePickerProps } from 'antd';
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction, TransactionInstruction } from '@solana/web3.js'
import {
  DEVNET_PROGRAM_ID,
  CLMM_PROGRAM_ID,
  CREATE_CPMM_POOL_PROGRAM,
  CREATE_CPMM_POOL_FEE_ACC,
} from '@raydium-io/raydium-sdk-v2'
import Decimal from 'decimal.js'
import BN from 'bn.js'
import { initSdk, txVersion } from '@/Dex/Raydium'
import { getTxLink, addPriorityFees } from '@/utils'
import { Input_Style, Button_Style, CREATE_POOL_FEE, BANANATOOLS_ADDRESS } from '@/config'
import { SOL, PUMP, USDT } from '@/config/Token'
import { useConfig } from '@/hooks';
import type { Token_Type } from '@/type'
import { Header, SelectToken, Result, Hint } from '@/components'
import { devConfigs } from './utils'
import { CreatePool } from './style'


function CreateLiquidity() {
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const { _isMainnet } = useConfig()
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();

  const [baseToken, setBaseToken] = useState<Token_Type>(PUMP)
  const [token, setToken] = useState<Token_Type>(USDT)
  const [isOptions, setIsOptions] = useState(false)
  const [isCreate, setIsCreate] = useState(false)
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');
  const [poolAddr, setPoolAddr] = useState('')

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


  const createClick = async () => {
    try {
      if (!token) return api.error({ message: "请选择代币" })


      setIsCreate(true)
      let startTime = new BN(0)
      if (isOptions && config.startTime) {
        startTime = new BN(config.startTime)
      }
      const raydium = await initSdk({
        owner: publicKey,
        connection: connection,
      });

      // RAY
      const mint1 = await raydium.token.getTokenInfo(baseToken.address)
      // USDT
      const mint2 = await raydium.token.getTokenInfo(token.address)
      const clmmConfigs = await raydium.api.getClmmConfigs()
      console.log(clmmConfigs, 'clmmConfigs')
      //  const clmmConfigs = devConfigs // devnet configs

      const execute = await raydium.clmm.createPool({
        programId: _isMainnet ? CLMM_PROGRAM_ID : DEVNET_PROGRAM_ID.CLMM,
        // programId: DEVNET_PROGRAM_ID.CLMM,
        mint1,
        mint2,
        ammConfig: { ...clmmConfigs[0], id: new PublicKey(clmmConfigs[0].id), fundOwner: '', description: '' },
        initialPrice: new Decimal(1),
        startTime: startTime,
        txVersion,
        // optional: set up priority fee here
        // computeBudgetConfig: {
        //   units: 600000,
        //   microLamports: 46591500,
        // },
      })

      console.log(execute)
      const addr: any = execute.extInfo.address
      let poolId = ''
      if (addr.poolId) poolId = addr.poolId.toBase58()
      console.log(poolId, 'poolid')
      const _transaction = execute.transaction;
      const Tx = new Transaction();
      const instructions = _transaction.message.compiledInstructions.map((instruction: any) => {
        return new TransactionInstruction({
          keys: instruction.accountKeyIndexes.map((index: any) => ({
            pubkey: _transaction.message.staticAccountKeys[index],
            isSigner: _transaction.message.isAccountSigner(index),
            isWritable: _transaction.message.isAccountWritable(index),
          })),
          programId: _transaction.message.staticAccountKeys[instruction.programIdIndex],
          data: Buffer.from(instruction.data),
        });
      });
      instructions.forEach((instruction: any) => Tx.add(instruction));
      const fee = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
        lamports: CREATE_POOL_FEE * LAMPORTS_PER_SOL,
      })
      Tx.add(fee)
      //增加费用，减少失败
      const versionedTx = await addPriorityFees(connection, Tx, publicKey)
      const signature = await sendTransaction(versionedTx, connection);
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
    <>
      {contextHolder1}

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

    </>
  )
}

export default CreateLiquidity