import { useEffect, useState } from 'react'
import { Button, notification, Segmented, Input, Flex, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
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
import { getMint } from '@solana/spl-token';
import { PoolFetchType, } from "@raydium-io/raydium-sdk-v2";
import { initSdk, RaydiumApi } from '@/Dex/Raydium'
import { Input_Style, Button_Style, REMOVE_POOL_FEE, BANANATOOLS_ADDRESS, isMainnet } from '@/config'
import { Page } from '@/styles'
import { getAsset } from '@/utils/sol'
import { getAt } from '@/utils/getAta'
import { getTxLink, addPriorityFees, getImage } from '@/utils'
import { SOL, PUMP } from '@/config/Token'
import type { Token_Type } from '@/type'
import { Header, SelectToken, Result } from '@/components'
import { isValidAmm } from './utils'
import queryLpByToken from './getAllPool'
import { CreatePool } from './style'
import { getSPLBalance } from '@/utils/util';

interface PoolType {
  lpReserve: number
  baseMint: string
  quoteMint: string
  pubkey: string
  marketProgramId: string //交易所
  baseSymbol: string
  baseImage: string
  symbol: string
  image: string
  balance: number
  lpMint: string
}

const JITOFEEARR = [
  { label: '25%', value: 1 },
  { label: '50%', value: 2 },
  { label: '75%', value: 3 },
  { label: '100%', value: 4 },
  { label: '自定义', value: 5 },
]

function CreateLiquidity() {
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();

  const [token, setToken] = useState<Token_Type>(null)
  const [isCreate, setIsCreate] = useState(false)
  const [poolAddr, setPoolAddr] = useState('')
  const [isSearch, setIsSearch] = useState(false)
  const [poolConfigArr, setPoolConfigArr] = useState<PoolType[]>([])
  const [segValue, setSegValue] = useState(1)
  const [isIdFind, setIsIdFind] = useState(false)
  const [withdramLp, setWithdramLp] = useState('')

  useEffect(() => {
    if (token && token.address && publicKey) getPoolInfo()
  }, [token, publicKey])

  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }
  const segValueChange = (e) => {
    setSegValue(e)
  }

  //池子id查找
  const poolFindInfoByID = async () => {
    try {
      if (!poolAddr) return api.error({ message: "请输入池子ID" })
      setIsSearch(true)
      const poolId = poolAddr
      let poolKeys: AmmV4Keys | AmmV5Keys | undefined
      let poolInfo: ApiV3PoolInfoStandardItem

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
      }
      const baseMint = poolInfo.mintA.address
      const quoteMint = poolInfo.mintB.address
      const pubkey = poolAddr
      const marketProgramId = poolInfo.marketId
      const { symbol: baseSymbol, image: baseImage } = await getAsset(connection, baseMint)
      const { symbol, image } = await getAsset(connection, quoteMint)
      const lpMint = new PublicKey(poolInfo.lpMint.address)
      const mintAccount = await getMint(connection, lpMint, 'processed')
      const lpReserve = Number(mintAccount.supply) / 10 ** mintAccount.decimals
      let balance = 0
      if (publicKey) {
        balance = await getSPLBalance(connection, lpMint, publicKey)
        console.log(balance, 'balance')
      }
      console.log(poolInfo, 'poolInfo')
      const obj: PoolType = {
        lpReserve,
        baseMint,
        quoteMint,
        pubkey,
        marketProgramId,
        baseSymbol,
        baseImage,
        symbol,
        image,
        balance,
        lpMint: poolInfo.lpMint.address
      }
      console.log(obj)
      setPoolConfigArr([obj])
      setIsSearch(false)
    } catch (error) {
      console.log(error)
      api.error({ message: error.toString() })
      setIsSearch(false)
    }
  }

  //代币地址查找
  const getPoolInfo = async () => {
    try {
      setIsSearch(true)
      const data = await queryLpByToken( token.address)
      const _data: any[] = data.Raydium_LiquidityPoolv4
      console.log(_data, '_data')
      const _result = _data.slice(0, 5)
      const allPoolConfig: PoolType[] = []
      for (let index = 0; index < _result.length; index++) {
        const item = _data[index];
        const { symbol: baseSymbol, image: baseImage } = await getAsset(connection, item.baseMint)
        const { symbol, image } = await getAsset(connection, item.quoteMint)
        let balance = 0
        if (publicKey) {
          try {
            balance = await getSPLBalance(connection, new PublicKey(item.pubkey), publicKey)
          } catch (error) {
            balance = 0
          }
        }
        const obj: PoolType = {
          lpReserve: item.lpReserve / LAMPORTS_PER_SOL,
          baseMint: item.baseMint,
          quoteMint: item.quoteMint,
          pubkey: item.pubkey,
          marketProgramId: item.marketProgramId,
          baseSymbol,
          baseImage,
          symbol,
          image,
          balance,
          lpMint: item.lpMint
        }
        allPoolConfig.push(obj)
      }
      setPoolConfigArr(allPoolConfig)
      console.log(allPoolConfig, 'allPoolConfig')
      setIsSearch(false)
    } catch (error) {
      console.log(error)
      api.error({ message: error.toString() })
      setIsSearch(false)
    }
  }

  const createClick = async (item: PoolType) => {
    try {
      if (!publicKey) return api.error({ message: "请先连接钱包" })
      setIsCreate(true)
      const poolId = item.pubkey
      const lpMint = item.lpMint
      let poolKeys: AmmV4Keys | AmmV5Keys | undefined
      let poolInfo: ApiV3PoolInfoStandardItem

      const balance = await getSPLBalance(connection, new PublicKey(lpMint), publicKey)
      console.log(balance, 'balance')
      if (balance <= 0) {
        api.error({ message: "当前账户lp余额为0" })
        setIsCreate(false)
        return
      }
      let withdrawLpAmount
      if (segValue < 5) {
        withdrawLpAmount = new BN(Number(balance * (segValue * 25) / 100 * 1000000000).toFixed(0))
      } else {
        withdrawLpAmount = new BN(Number(Number(withdramLp) * 1000000000).toFixed(0))
      }
      console.log(withdrawLpAmount, 'withdrawLpAmount')
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
        api.success({ message: "移除流动性成功" })
        isIdFind ? poolFindInfoByID() : getPoolInfo()
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
          {isIdFind ?
            <div>
              <div>池子ID</div>
              <div className='tokenInput'>
                <div className='input'>
                  <Input type="text" className={Input_Style} placeholder='请输入池子ID'
                    value={poolAddr} onChange={(e) => setPoolAddr(e.target.value)}
                  />
                </div>
                <div className='buttonSwapper'>
                  <Button className={Button_Style} loading={isSearch}
                    onClick={poolFindInfoByID} >
                    <span>搜索</span>
                  </Button>
                </div>
              </div>
              <div className='flex text-base mt-1'>
                <div>不知道池子ID，试试</div>
                <div className='ml-2 text-rose-600 pointer' onClick={() => setIsIdFind(false)}>代币地址查找</div>
              </div>
            </div> :
            <div>
              <div className='mb-1'>请选择代币</div>
              <SelectToken selecToken={token} callBack={backClick} />
              <div className='flex text-base mt-1'>
                <div>通过</div>
                <div className='ml-2 text-rose-600 pointer' onClick={() => setIsIdFind(true)}>池子ID查找</div>
              </div>
            </div>
          }
          <Button onClick={getPoolInfo}>twte</Button>
        </div>

        {
          isSearch &&
          <Flex align="center" gap="middle" className='mt-4 mb-4 ml-4'>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          </Flex>
        }

        {!isSearch && <div>
          {poolConfigArr.map((item, index) => (
            <div className='card' key={index}>
              <div className='info'>
                <div className='header'>
                  <div className='flex'>
                    <img src={item.baseSymbol === 'SOL' ? getImage('sol.png') : item.baseImage} />
                    <img src={item.symbol === 'SOL' ? getImage('sol.png') : item.quoteMint} />
                    <div className='font-bold'>{item.baseSymbol}/</div>
                    <div className='font-bold'>{item.symbol}</div>
                  </div>
                  <div className='font-bold'>{item.lpReserve}</div>
                </div>
                <div className='flex mt-2 items-center'>
                  <div className='text-sm'>池子ID：</div>
                  <div>{item.pubkey}</div>
                </div>
              </div>
              <div className='card1'>
                <div className='flex justify-between'>
                  <div>资金池份数</div>
                  <div>{item.balance}</div>
                </div>
                <div className='flex justify-between mt-2'>
                  <div>移除数量</div>
                  <div>{JITOFEEARR[segValue - 1].label}</div>
                </div>
                <div className='seg mt-2'>
                  <Segmented options={JITOFEEARR} size='large' value={segValue} onChange={segValueChange} />
                  {segValue === 5 && <Input className={`${Input_Style} mt-2`} value={withdramLp}
                    onChange={(e) => setWithdramLp(e.target.value)} type='number' />}
                </div>


                <div className='btn mt-5'>
                  <div className='buttonSwapper mt-4'>
                    <Button className={Button_Style} onClick={() => createClick(item)} loading={isCreate}>移除</Button>
                  </div>
                  <div className='fee'>全网最低服务费: {REMOVE_POOL_FEE} SOL</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        }

      </CreatePool>

    </Page>
  )
}

export default CreateLiquidity