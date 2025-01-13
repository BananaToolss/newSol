import { PumpFunSDK } from "@/Dex/Pump";
import {
  Keypair, PublicKey, SystemProgram,
  Transaction, LAMPORTS_PER_SOL, Connection,
  TransactionInstruction, sendAndConfirmTransaction
} from '@solana/web3.js';
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
import BN from "bn.js";
import { ethers } from 'ethers'
import { fetcher } from '@/utils'
import { initSdk, txVersion } from '@/Dex/Raydium'
import { BANANATOOLS_ADDRESS, SWAP_BOT_FEE, PUMP_SWAP_BOT_FEE, isMainnet } from '@/config'
import { SOL_TOKEN } from '@/config/Token'
import { delay, getRandomNumber, getSPLBalance, getCurrentTimestamp } from './utils';
import { getTxLink, addPriorityFees } from '@/utils'
import { isValidAmm, isValidCpmm } from '../Raydium/RemoveLiquidity/utils'

const isAMM = false
const AMM_POOL = 'CGjmakq9tEteMMsBNmhyCBeM3Spqax58VYyFpa9XERw9'
const CPMM_POOL = 'DZtjekDo2LEgCnhsWmCzUcqG7cZstFHyp7biG1A8nhzQ'
const priorityFees = {
  unitLimit: 5_000_000,
  unitPrice: 200_000,
}
const BASE_NUMBER = 10000

export const PumpFunSwap = async (
  connection: Connection,
  sdk: PumpFunSDK,
  account: Keypair,
  modeType: number,
  BsetToken: PublicKey,
  amountIn: number, //需要精度
  slippage: bigint,
) => {
  try {
    const newTx = new Transaction()
    if (modeType === 1 || modeType === 3) {
      const { buyTx, buyAmount } = await sdk.buy(account, BsetToken, BigInt((amountIn).toFixed(0)), slippage)
      newTx.add(buyTx)
      if (modeType === 3) {
        const sellTx = await sdk.sell(account, BsetToken, buyAmount, slippage)
        newTx.add(sellTx)
      }
    } else if (modeType === 2) {
      const sellTx = await sdk.sell(account, BsetToken, BigInt((amountIn).toFixed(0)), slippage)
      newTx.add(sellTx)
    }
    newTx.add(
      SystemProgram.transfer({
        fromPubkey: account.publicKey,
        toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
        lamports: PUMP_SWAP_BOT_FEE * LAMPORTS_PER_SOL,
      })
    );

    //增加费用，减少失败
    const versionedTx = await addPriorityFees(connection, newTx, account.publicKey);
    versionedTx.sign([account])
    const sig = await connection.sendTransaction(versionedTx, {
      skipPreflight: false,
    });
    return sig
  } catch (error) {
    return null
  }
}

export const RaydiumSwap = async (
  connection: Connection,
  raydium: Raydium,
  account: Keypair,
  modeType: number,
  QuteToken: PublicKey,
  BaseToken: PublicKey,
  amountIn: number,//不需要精度
  slippage: number,
) => {
  try {
    let poolInfo: ApiV3PoolInfoStandardItem | undefined;
    let poolKeys: AmmV4Keys | undefined;
    let rpcData: AmmRpcData;

    let poolInfoCpmm: ApiV3PoolInfoStandardItemCpmm | undefined;
    let poolKeysCpmm: CpmmKeys | undefined;
    let rpcDataCpmm: CpmmRpcData;

    let programId = ''
    let price = ''

    if (isMainnet) {
      const tokenPool: any = await raydium.api.fetchPoolByMints({ mint1: QuteToken, mint2: BaseToken })
      const poolId = tokenPool.data[0].id
      const data = await raydium.api.fetchPoolById({ ids: poolId })
      const poolInfo = data[0]
      programId = poolInfo.programId
      if (isValidAmm(poolInfo.programId)) {
        poolKeys = await raydium.liquidity.getAmmPoolKeys(poolId);
        rpcData = await raydium.liquidity.getRpcPoolInfo(poolId);
      }
      if (isValidCpmm(poolInfo.programId)) {
        rpcDataCpmm = await raydium.cpmm.getRpcPoolInfo(poolInfo.id, true);
      }
      const _price = !poolInfo ? 0 : poolInfo.mintA.address === SOL_TOKEN
        ? 1 / poolInfo.price
        : poolInfo.price;
      price = _price.toFixed(18)
    } else {
      if (isAMM) {
        const data = await raydium.liquidity.getPoolInfoFromRpc({ poolId: AMM_POOL })
        poolInfo = data.poolInfo;
        poolKeys = data.poolKeys;
        rpcData = data.poolRpcData;
        programId = poolInfo.programId
        const _price =
          poolInfo.mintA.address == QuteToken.toBase58()
            ? poolInfo.mintAmountA / poolInfo.mintAmountB
            : poolInfo.mintAmountB / poolInfo.mintAmountA;
        price = _price.toFixed(18)
      } else {
        const data = await raydium.cpmm.getPoolInfoFromRpc(CPMM_POOL);
        poolInfoCpmm = data.poolInfo;
        poolKeysCpmm = data.poolKeys;
        rpcDataCpmm = data.rpcData;
        programId = poolInfoCpmm.programId
        const _price =
          poolInfoCpmm.mintA.address == QuteToken.toBase58()
            ? poolInfoCpmm.mintAmountA / poolInfoCpmm.mintAmountB
            : poolInfoCpmm.mintAmountB / poolInfoCpmm.mintAmountA;
        price = _price.toFixed(18)
      }
    }
    if (!isValidAmm(programId) && !isValidCpmm(programId)) throw new Error('target pool is not AMM pool and Cpmm Pool')
    let signature = ''
    if (isValidAmm(programId)) {
      signature = await RaydiumAMMSwap(connection, raydium,
        account, modeType, BaseToken, amountIn, slippage, poolInfo, poolKeys, rpcData)
    }
    if (isValidCpmm(programId)) {
      signature = await RaydiumCPMMSwap(connection, raydium,
        account, modeType, BaseToken, amountIn, slippage, poolInfoCpmm, poolKeysCpmm, rpcDataCpmm)
    }
    return { signature, price }
  } catch (error) {
    console.log(error,'RaydiumSwap')
    return null
  }
}

export const RaydiumAMMSwap = async (
  connection: Connection,
  raydium: Raydium,
  account: Keypair,
  modeType: number,
  BaseToken: PublicKey,
  amountIn: number, //不需要精度
  slippage: number,
  poolInfo: ApiV3PoolInfoStandardItem,
  poolKeys: AmmV4Keys,
  rpcData: AmmRpcData,
) => {
  try {
    const [baseReserve, quoteReserve, status] = [
      rpcData.baseReserve,
      rpcData.quoteReserve,
      rpcData.status.toNumber(),
    ];
    if (poolInfo.mintA.address !== BaseToken.toBase58() && poolInfo.mintB.address !== BaseToken.toBase58())
      throw new Error('target pool is not AMM pool and Cpmm Pool')
    const baseIn = (BaseToken.toBase58() === poolInfo.mintB.address);
    let mintIn, mintOut;
    if (modeType === 1) {        // 买入
      [mintIn, mintOut] = baseIn
        ? [poolInfo.mintA, poolInfo.mintB]
        : [poolInfo.mintB, poolInfo.mintA];
    } else {       // 卖出
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
      slippage: slippage, //滑点 // range: 1 ~ 0.0001, means 100% ~ 0.01%
    });

    //交易
    const execute = await raydium.liquidity.swap({
      poolInfo,
      poolKeys,
      amountIn: new BN(amountIn * 10 ** (mintIn.decimals)),
      amountOut: out.minAmountOut,
      fixedSide: "in",
      inputMint: mintIn.address,
      txVersion,
      computeBudgetConfig: {
        units: priorityFees.unitLimit,
        microLamports: priorityFees.unitPrice,
      },
    });

    const transaction = execute.transaction;
    const Tx = new Transaction();
    const instructions = transaction.message.compiledInstructions.map((instruction: any) => {
      return new TransactionInstruction({
        keys: instruction.accountKeyIndexes.map((index: any) => ({
          pubkey: transaction.message.staticAccountKeys[index],
          isSigner: transaction.message.isAccountSigner(index),
          isWritable: transaction.message.isAccountWritable(index),
        })),
        programId: transaction.message.staticAccountKeys[instruction.programIdIndex],
        data: Buffer.from(instruction.data),
      });
    });
    instructions.forEach((instruction: any) => Tx.add(instruction));
    if (true) {
      Tx.add(
        SystemProgram.transfer({
          fromPubkey: account.publicKey,
          toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
          lamports: SWAP_BOT_FEE * LAMPORTS_PER_SOL,
        })
      );
    }
    const { blockhash } = await connection.getLatestBlockhash('processed');
    Tx.recentBlockhash = blockhash;
    const finalTxId = await sendAndConfirmTransaction(connection, Tx, [account],
      { commitment: 'processed', skipPreflight: true });
    return finalTxId
  } catch (error) {
    console.log(error,'RaydiumAMMSwap')
    return null
  }
}

export const RaydiumCPMMSwap = async (
  connection: Connection,
  raydium: Raydium,
  account: Keypair,
  modeType: number,
  BaseToken: PublicKey,
  amountIn: number, //不需要精度
  slippage: number,
  poolInfoCpmm: ApiV3PoolInfoStandardItemCpmm,
  poolKeysCpmm: CpmmKeys,
  rpcDataCpmm: CpmmRpcData,
) => {
  try {
    if (BaseToken.toBase58() !== poolInfoCpmm.mintA.address && BaseToken.toBase58() !== poolInfoCpmm.mintB.address)
      throw new Error('input mint does not match pool')
    let mintIn: ApiV3Token;
    if (modeType === 1) {
      mintIn = poolInfoCpmm.mintA.address == BaseToken.toBase58() ? poolInfoCpmm.mintB : poolInfoCpmm.mintA;
    } else {
      mintIn = poolInfoCpmm.mintA.address == BaseToken.toBase58() ? poolInfoCpmm.mintA : poolInfoCpmm.mintB;
    }
    const baseIn = mintIn.address === poolInfoCpmm.mintA.address;
    console.log(baseIn, 'baseIn', mintIn.address)
    const swapRes = CurveCalculator.swap(
      new BN(amountIn * 10 ** (mintIn.decimals)), //判断精度,
      baseIn ? rpcDataCpmm.baseReserve : rpcDataCpmm.quoteReserve,
      baseIn ? rpcDataCpmm.quoteReserve : rpcDataCpmm.baseReserve,
      rpcDataCpmm.configInfo!.tradeFeeRate
    );
    const swapResult = await raydium.cpmm.swap({
      poolInfo: poolInfoCpmm,
      poolKeys: poolKeysCpmm,
      swapResult: swapRes,
      inputAmount: new BN(amountIn * 10 ** (mintIn.decimals)),
      slippage: slippage, //滑点 // range: 1 ~ 0.0001, means 100% ~ 0.01%, //滑点 // range: 1 ~ 0.0001, means 100% ~ 0.01%),
      baseIn,
      computeBudgetConfig: {
        units: priorityFees.unitLimit,
        microLamports: priorityFees.unitPrice,
      },
    });
    // 提取交易对象
    const transaction = swapResult.transaction as Transaction;
    // 创建新的 Transaction 对象
    const combinedTransaction = new Transaction();
    combinedTransaction.add(transaction)
    // 添加手续费转账指令
    if (true) {
      combinedTransaction.add(
        SystemProgram.transfer({
          fromPubkey: account.publicKey,
          toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
          lamports: SWAP_BOT_FEE * LAMPORTS_PER_SOL,
        })
      );
    }
    const { blockhash } = await connection.getLatestBlockhash('processed');
    // 设置最近区块哈希
    combinedTransaction.recentBlockhash = blockhash;
    // 发送并确认合并后的交易
    const finalTxId = await sendAndConfirmTransaction(connection, combinedTransaction, [account],
      { commitment: 'processed', skipPreflight: true });
    return finalTxId
  } catch (error) {
    console.log(error,'RaydiumCPMMSwap')
    return null
  }
}

export const getSolPrice = async () => {
  try {
    const url = `https://api.jup.ag/price/v2?ids=${SOL_TOKEN}`
    const resut = await fetcher(url)
    const price = resut.data[SOL_TOKEN].price
    return price
  } catch (error) {
    return null
  }
}

export const getPumpPrice = async (
  sdk: PumpFunSDK,
  BseToken: PublicKey,
  solPrice: string
) => {
  try {
    const tokenPool = await sdk.getBondingCurveAccount(BseToken)
    const capSOL = tokenPool.getMarketCapSOL()
    const _price = ethers.utils.formatEther(capSOL)
    const price = ethers.utils.parseEther(_price).mul(ethers.utils.parseEther(solPrice)).div(ethers.utils.parseEther('1'))
    const _pri = ethers.utils.formatEther(price)
    return _pri
  } catch (error) {
    return null
  }
}
//raydium获取池子地址,池子类型，价格
export const getRayDiumPrice = async (
  raydium: Raydium,
  QueteToken: PublicKey,
  BsetToken: PublicKey,
) => {
  try {
    let price = '' //价格
    let poolId = isAMM ? AMM_POOL : CPMM_POOL //dev
    if (isMainnet) {
      const tokenPool: any = await raydium.api.fetchPoolByMints({ mint1: QueteToken, mint2: BsetToken })
      poolId = tokenPool.data[0].id
      const data = await raydium.api.fetchPoolById({ ids: poolId })
      const poolInfo = data[0]
      const _price = !poolInfo ? 0 : poolInfo.mintA.address === SOL_TOKEN
        ? 1 / poolInfo.price
        : poolInfo.price;
      price = _price.toFixed(18)
    } else {
      if (isAMM) {
        const data = await raydium.liquidity.getPoolInfoFromRpc({ poolId })
        const poolInfo = data.poolInfo
        const _price =
          poolInfo.mintA.address == QueteToken.toBase58()
            ? poolInfo.mintAmountA / poolInfo.mintAmountB
            : poolInfo.mintAmountB / poolInfo.mintAmountA;
        price = _price.toFixed(18)
      } else {
        const data = await raydium.cpmm.getPoolInfoFromRpc(CPMM_POOL);
        const poolInfoCpmm = data.poolInfo;
        const _price =
          poolInfoCpmm.mintA.address == QueteToken.toBase58()
            ? poolInfoCpmm.mintAmountA / poolInfoCpmm.mintAmountB
            : poolInfoCpmm.mintAmountB / poolInfoCpmm.mintAmountA;
        price = _price.toFixed(18)
      }
    }
    console.log(price, 'price')
    const solPrice = await getSolPrice()
    console.log(solPrice, 'solPrice')
    const _price = ethers.utils.parseEther(price).mul(ethers.utils.parseEther(solPrice)).div(ethers.utils.parseEther('1'))
    const _pri = ethers.utils.formatEther(_price)
    console.log(_pri,'_pri')
    return _pri
  } catch (error) {
    return null
  }
}

//输出数量
export const getAmountIn = async (
  connection: Connection,
  account: Keypair,
  BseToken: PublicKey,
  modeType: number,
  amountType: number,
  minAmount: number,
  maxAmount: number
) => {
  try {
    let balance = await connection.getBalance(account.publicKey)
    const Solb = balance / LAMPORTS_PER_SOL
    let amountIn = 0
    if (modeType === 1 || modeType === 3) { //拉盘
      if (amountType === 1) {
        amountIn = minAmount
      } else if (amountType === 2) {
        amountIn = balance * minAmount / 100
      } else if (amountType === 3) {
        const min = minAmount * BASE_NUMBER
        const max = maxAmount * BASE_NUMBER
        amountIn = getRandomNumber(min, max) / BASE_NUMBER
      }
      amountIn = amountIn < Solb - (SWAP_BOT_FEE + 0.00005) ? amountIn : 0
    }
    if (modeType === 2) { //砸盘
      const tokenB = await getSPLBalance(connection, BseToken, account.publicKey)
      console.log(tokenB, minAmount)
      if (amountType === 1) {
        amountIn = minAmount
      } else if (amountType === 2) {
        amountIn = tokenB * minAmount / 100
      } else if (amountType === 3) {
        const min = minAmount * BASE_NUMBER
        const max = maxAmount * BASE_NUMBER
        amountIn = getRandomNumber(min, max) / BASE_NUMBER
      }
      amountIn = amountIn <= tokenB ? amountIn : 0
      console.log(amountIn, 'amountIn')
    }
    return { balance, amountIn }
  } catch (error) {
    return { balance: 0, amountIn: 0 }
  }
}