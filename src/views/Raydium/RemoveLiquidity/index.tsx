import { useEffect, useState } from 'react'
import { Button, notification } from 'antd'
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js'
import {
  TxVersion,
  AmmV4Keys,
  AmmV5Keys,
  ApiV3PoolInfoStandardItem,
} from '@raydium-io/raydium-sdk-v2'
import BN from 'bn.js'
import Decimal from 'decimal.js'
import { PoolFetchType, } from "@raydium-io/raydium-sdk-v2";
import { initSdk, RaydiumApi } from '@/Dex/Raydium'
import { Input_Style, Button_Style, REMOVE_POOL_FEE, BANANATOOLS_ADDRESS, isMainnet } from '@/config'
import { Page } from '@/styles'
import { getAsset } from '@/utils/sol'
import { getTxLink, addPriorityFees } from '@/utils'
import { SOL, PUMP } from '@/config/Token'
import type { Token_Type } from '@/type'
import { Header, SelectToken, Result } from '@/components'
import { isValidAmm } from './utils'
import queryLpByToken from './getAllPool'
import { CreatePool } from './style'

interface PoolType {
  lpReserve: number
  baseMint: string
  quoteMint: string
  pubkey: string
  marketProgramId: string
  baseSymbol: string
  baseImage: string
  symbol: string
  image: string
}

function CreateLiquidity() {
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();

  const [token, setToken] = useState<Token_Type>(SOL)
  const [isCreate, setIsCreate] = useState(false)
  const [poolAddr, setPoolAddr] = useState('')
  const [isSearchId, setIsSearchId] = useState(false)
  const [poolConfigArr, setPoolConfigArr] = useState<PoolType[]>([])

  useEffect(() => {
    if (token.address) getPoolInfo()
  }, [token])

  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }

  const getPoolInfo = async () => {
    try {
      const data = await queryLpByToken(token.address)
      const _data = data.Raydium_LiquidityPoolv4
      const _result = _data.slice(0, 5)
      const allPoolConfig: PoolType[] = []
      for (let index = 0; index < _result.length; index++) {
        const item = _data[index];
        const { symbol: baseSymbol, image: baseImage } = await getAsset(connection, item.baseMint)
        const { symbol, image } = await getAsset(connection, item.quoteMint)

        const obj: PoolType = {
          lpReserve: item.lpReserve,
          baseMint: item.baseMint,
          quoteMint: item.quoteMint,
          pubkey: item.pubkey,
          marketProgramId: item.marketProgramId,
          baseSymbol,
          baseImage,
          symbol,
          image
        }
        allPoolConfig.push(obj)
      }
      setPoolConfigArr(allPoolConfig)
      console.log(allPoolConfig, 'allPoolConfig')
    } catch (error) {
      console.log(error)
    }
  }

  const createClick = async () => {
    try {
      setIsCreate(true)
      const poolId = '23miCdKG2WNVS3AUZ55ErSNRFRXNx2ZWHw4g4ChRVeYC'
      let poolKeys: AmmV4Keys | AmmV5Keys | undefined
      let poolInfo: ApiV3PoolInfoStandardItem
      const withdrawLpAmount = new BN(Number(1) * 1000000000)

      const raydium = await initSdk({
        owner: publicKey,
        connection: connection,
      });

      if (isMainnet) {
        const data = await raydium.api.fetchPoolById({ ids: poolId })
        poolInfo = data[0] as ApiV3PoolInfoStandardItem
      } else {
        const data = await raydium.liquidity.getPoolInfoFromRpc({ poolId })
        poolInfo = data.poolInfo
        poolKeys = data.poolKeys
      }

      const txVersion = TxVersion.V0
      try {
        if (!isValidAmm(poolInfo.programId)) throw new Error('target pool is not AMM pool')
        const [baseRatio, quoteRatio] = [
          new Decimal(poolInfo.mintAmountA).div(poolInfo.lpAmount || 1),
          new Decimal(poolInfo.mintAmountB).div(poolInfo.lpAmount || 1),
        ]

        const withdrawAmountDe = new Decimal(withdrawLpAmount.toString()).div(10 ** poolInfo.lpMint.decimals)
        const [withdrawAmountA, withdrawAmountB] = [
          withdrawAmountDe.mul(baseRatio).mul(10 ** (poolInfo?.mintA.decimals || 0)),
          withdrawAmountDe.mul(quoteRatio).mul(10 ** (poolInfo?.mintB.decimals || 0)),
        ]

        const lpSlippage = 0.1 // means 1%

        const execute = await raydium.liquidity.removeLiquidity({
          poolInfo,
          poolKeys,
          lpAmount: withdrawLpAmount,
          baseAmountMin: new BN(withdrawAmountA.mul(1 - lpSlippage).toFixed(0)),
          quoteAmountMin: new BN(withdrawAmountB.mul(1 - lpSlippage).toFixed(0)),
          txVersion,
          // optional: set up priority fee here
          // computeBudgetConfig: {
          //   units: 600000,
          //   microLamports: 46591500,
          // },
        })

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
          lamports: REMOVE_POOL_FEE * LAMPORTS_PER_SOL,
        })
        Tx.add(fee)
        //增加费用，减少失败
        const versionedTx = await addPriorityFees(connection, Tx, publicKey)
        const signature = await sendTransaction(versionedTx, connection);
        const confirmed = await connection.confirmTransaction(
          signature,
          "processed"
        );
        setIsCreate(false);
      } catch (error) {
        console.log(error, 'ssssssssssss')
        console.log(error)
        api.error({ message: error.toString() })
        setIsCreate(false);
      }


    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Page>
      {contextHolder1}
      <Header title='移除流动性' hint='移除当前代币的AMM流动性,并收回流动性池内所有的报价代币(SOL),移除流动性后代币将无法交易,流动性池内的资金会自动回流到创建者钱包' />
      <CreatePool>
        <div>
          <div className='mb-1'>请选择代币</div>
          <SelectToken selecToken={token} callBack={backClick} />
        </div>
        <div>
          {poolConfigArr.map((item, index) => (
            <div className='card' key={index}>
              <div className='header'>
                <div className='flex'>
                  <img src={item.baseImage} />
                  <img src={item.quoteMint} />
                  <div className='font-bold'>{item.baseSymbol}/</div>
                  <div className='font-bold'>{item.symbol}</div>
                </div>
                <div>{item.lpReserve}</div>
              </div>
              <div className='flex mt-2 items-center'>
                <div className='text-sm'>池子ID：</div>
                <div>{item.pubkey}</div>
              </div>
            </div>
          ))}
        </div>
        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={createClick} loading={isCreate}>移除</Button>
          </div>
          <div className='fee'>全网最低服务费: {REMOVE_POOL_FEE} SOL</div>
        </div>
      </CreatePool>

    </Page>
  )
}

export default CreateLiquidity