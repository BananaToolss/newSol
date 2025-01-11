
import { PublicKey, Connection, TransactionInstruction, Signer } from "@solana/web3.js"
import {
  ACCOUNT_SIZE, AccountLayout, MintLayout, NATIVE_MINT,
  TOKEN_PROGRAM_ID, amountToUiAmount, createAssociatedTokenAccountInstruction,
  createInitializeAccountInstruction, decodeAmountToUiAmountInstructionUnchecked,
  getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount
} from "@solana/spl-token";
import BN from 'bn.js'
import {
  Market as RayMarket,
  splAccountLayout,
  getAssociatedPoolKeys,
  AMM_V4,
  DEVNET_PROGRAM_ID,
  createPoolV4InstructionV2,
  TxVersion,
  getLiquidityAssociatedId
  // SplAccountLayout
} from '@raydium-io/raydium-sdk-v2'
import { toBufferBE } from "bigint-buffer";
import { isMainnet } from "@/config";

export type CreatePoolInput = {
  baseMint: PublicKey,
  quoteMint: PublicKey,
  marketId: PublicKey,
  baseMintAmount: number,
  quoteMintAmount: number,
}

function calcNonDecimalValue(value: number, decimals: number): number {
  return Math.trunc(value * (Math.pow(10, decimals)))
}


const createPool = async (connection: Connection, input: CreatePoolInput, user: PublicKey) => {
  const userBaseAta = getAssociatedTokenAddressSync(input.baseMint, user)
  const userQuoteAta = getAssociatedTokenAddressSync(input.quoteMint, user)

  let [baseMintAccountInfo, quoteMintAccountInfo, marketAccountInfo, userBaseAtaInfo, userQuoteAtaInfo] =
    await connection.getMultipleAccountsInfo([input.baseMint, input.quoteMint, input.marketId, userBaseAta, userQuoteAta])
      .catch(() => [null, null, null, null])
  if (!baseMintAccountInfo || !quoteMintAccountInfo || !marketAccountInfo) throw "AccountInfo not found"
  if (input.baseMint.toBase58() != NATIVE_MINT.toBase58() && !userBaseAtaInfo) throw "Don't have enought tokens"
  else {
    if (input.baseMint.toBase58() == NATIVE_MINT.toBase58()) {
      const todo = PublicKey.default
      const buf = Buffer.alloc(splAccountLayout.span)
      splAccountLayout.encode({
        mint: NATIVE_MINT,
        amount: new BN(0),
        isNative: new BN(1),
        owner: user,
        closeAuthority: todo,
        closeAuthorityOption: 1,
        delegate: todo,
        delegatedAmount: new BN(1),
        delegateOption: 1,
        isNativeOption: 1,
        state: 1
      }, buf)
      userBaseAtaInfo = {
        data: buf,
      } as any
    }
  }
  if (input.quoteMint.toBase58() != NATIVE_MINT.toBase58() && !userQuoteAtaInfo) throw "Don't have enought tokens"
  else {
    if (input.quoteMint.toBase58() == NATIVE_MINT.toBase58()) {
      const todo = PublicKey.default
      const buf = Buffer.alloc(splAccountLayout.span)
      splAccountLayout.encode({
        mint: NATIVE_MINT,
        amount: new BN(0),
        isNative: new BN(1),
        owner: user,
        closeAuthority: todo,
        closeAuthorityOption: 1,
        delegate: todo,
        delegatedAmount: new BN(1),
        delegateOption: 1,
        isNativeOption: 1,
        state: 1
      }, buf)
      userQuoteAtaInfo = {
        data: buf,
      } as any
    }
  }

  const ammProgramId = isMainnet ? AMM_V4 : DEVNET_PROGRAM_ID.AmmV4
  const feeDestinationId = isMainnet ? new PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5") : new PublicKey("3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR")


  const baseMintState = MintLayout.decode(baseMintAccountInfo.data);
  const quoteMintState = MintLayout.decode(quoteMintAccountInfo.data);
  // const marketState = RayMarket.getLayouts(3).state.decode(marketAccountInfo.data)
  const marketInfo = {
    marketId: input.marketId,
    programId: marketAccountInfo.owner
  }
  const baseMintInfo = {
    mint: input.baseMint,
    decimals: baseMintState.decimals
  }
  const quoteMintInfo = {
    mint: input.quoteMint,
    decimals: quoteMintState.decimals
  }
  const baseAmount = new BN(toBufferBE(BigInt(calcNonDecimalValue(input.baseMintAmount, baseMintState.decimals).toString()), 8))
  const quoteAmount = new BN(toBufferBE(BigInt(calcNonDecimalValue(input.quoteMintAmount, quoteMintState.decimals).toString()), 8))
  // const quoteAmount = new BN(calcNonDecimalValue(input.quoteMintAmount, quoteMintState.decimals))
  const poolInfo = getAssociatedPoolKeys({
    version: 4,
    marketVersion: 3,
    marketId: marketInfo.marketId,
    baseMint: baseMintInfo.mint,
    quoteMint: quoteMintInfo.mint,
    baseDecimals: baseMintInfo.decimals,
    quoteDecimals: quoteMintInfo.decimals,
    programId: ammProgramId,
    marketProgramId: marketInfo.programId,
  })
  const marketState = RayMarket.getLayouts(3).state.decode(marketAccountInfo.data)
  // this.addPoolKeys(poolInfo, marketState);

  const startTime = new BN(Math.trunc(Date.now() / 1000) - 4)


  const createPoolIxs = (await Liquidity.makeCreatePoolV4InstructionV2Simple({
    marketInfo,
    baseMintInfo,
    quoteMintInfo,
    baseAmount,
    quoteAmount,
    associatedOnly: true,
    checkCreateATAOwner: true,
    connection: connection,
    feeDestinationId: feeDestinationId,
    makeTxVersion: TxVersion.LEGACY,
    ownerInfo: {
      feePayer: user,
      tokenAccounts: [
        { accountInfo: splAccountLayout.decode(userBaseAtaInfo!.data), programId: TOKEN_PROGRAM_ID, pubkey: userBaseAta },
        { accountInfo: splAccountLayout.decode(userQuoteAtaInfo!.data), programId: TOKEN_PROGRAM_ID, pubkey: userQuoteAta }
      ],
      wallet: user,
      useSOLBalance: true
    },
    programId: ammProgramId,
    startTime
    // computeBudgetConfig: { microLamports: 250_000, units: 8000_000 },
  })).innerTransactions

  const ixs: TransactionInstruction[] = []
  const signers: Signer[] = []
  // ixs.push(...createPoolIxs.instructions)
  // signers.push(...createPoolIxs.signers)
  for (let ix of createPoolIxs) {
    ixs.push(...ix.instructions)
    signers.push(...ix.signers)
  }
  return {
    ixs, signers, poolId: Liquidity.getAssociatedId({ marketId: marketInfo.marketId, programId: ammProgramId }),
    baseAmount, quoteAmount, baseDecimals: poolInfo.baseDecimals, quoteDecimals: poolInfo.quoteDecimals
  }
}


// const addPoolKeys = (poolInfo: LiquidityAssociatedPoolKeys, marketState: any) => {
//   const { authority, baseDecimals, baseMint, baseVault, configId, id, lookupTableAccount, lpDecimals, lpMint, lpVault, marketAuthority, marketId, marketProgramId, marketVersion, nonce, openOrders, programId, quoteDecimals, quoteMint, quoteVault, targetOrders, version, withdrawQueue, } = poolInfo
//   const { baseVault: marketBaseVault, quoteVault: marketQuoteVault, eventQueue: marketEventQueue, bids: marketBids, asks: marketAsks } = marketState
//   const res: LiquidityPoolKeys = {
//     baseMint,
//     quoteMint,
//     quoteDecimals,
//     baseDecimals,
//     authority,
//     baseVault,
//     quoteVault,
//     id,
//     lookupTableAccount,
//     lpDecimals,
//     lpMint,
//     lpVault,
//     marketAuthority,
//     marketId,
//     marketProgramId,
//     marketVersion,
//     openOrders,
//     programId,
//     targetOrders,
//     version,
//     withdrawQueue,
//     marketAsks,
//     marketBids,
//     marketBaseVault,
//     marketQuoteVault,
//     marketEventQueue,
//   }
//   this.cachedPoolKeys.set(id.toBase58(), res)
// }
// export default createPool