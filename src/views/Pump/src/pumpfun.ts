import {
  Commitment,
  Connection,
  Finality,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  ComputeBudgetProgram,
  SystemProgram,
  TransactionInstruction,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Program, Provider } from "@coral-xyz/anchor";
import base58 from "bs58";
import axios from 'axios'
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { BN } from "bn.js";
import { addPriorityFeesJito, addPriorityFees } from '@/utils'
import { BANANATOOLS_ADDRESS, PUMP_CREATE_FEE } from '@/config'
import { GlobalAccount } from "./globalAccount";
import {
  CompleteEvent,
  CreateEvent,
  CreateTokenMetadata,
  PriorityFee,
  PumpFunEventHandlers,
  PumpFunEventType,
  SetParamsEvent,
  TradeEvent,
  TransactionResult,
  TransactionResult2
} from "./types";
import {
  toCompleteEvent,
  toCreateEvent,
  toSetParamsEvent,
  toTradeEvent,
} from "./events";
import { BondingCurveAccount } from "./bondingCurveAccount";
import {
  DEFAULT_COMMITMENT,
  DEFAULT_FINALITY,
  buildTx,
  calculateWithSlippageBuy,
  calculateWithSlippageSell,
  getRandomInt,
  sendTx,
} from "./util";
import { PumpFun, IDL } from "./IDL";
// import { getUploadedMetadataURI } from "./uploadToIpfs";
import { jitoWithAxios } from "./jitoWithAxios";


export const global_mint = new PublicKey("p89evAyzjd9fphjJx7G3RFA48sbZdpGEppRcfRNpump")

const PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const MPL_TOKEN_METADATA_PROGRAM_ID =
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

export const GLOBAL_ACCOUNT_SEED = "global";
export const MINT_AUTHORITY_SEED = "mint-authority";
export const BONDING_CURVE_SEED = "bonding-curve";
export const METADATA_SEED = "metadata";

export const DEFAULT_DECIMALS = 6;

export class PumpFunSDK {
  public program: Program<PumpFun>;
  public connection: Connection;
  constructor(provider?: Provider) {
    this.program = new Program<PumpFun>(IDL as PumpFun, provider);
    this.connection = this.program.provider.connection;
  }

  async createAndBuy(
    creator: Keypair,
    mint: Keypair,
    buyers: Keypair[],
    createTokenMetadata: CreateTokenMetadata,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = 300n,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT,
    finality: Finality = DEFAULT_FINALITY
  ) {
    // let tokenMetadata = await this.createTokenMetadata(createTokenMetadata);

    let createTx = await this.getCreateInstructions(
      creator.publicKey,
      createTokenMetadata.name,
      createTokenMetadata.symbol,
      // tokenMetadata.metadataUri,
      'ss',
      mint
    );

    let newTx = new Transaction().add(createTx);
    let buyTxs: VersionedTransaction[] = [];

    let createVersionedTx = await buildTx(
      this.connection,
      newTx,
      creator.publicKey,
      [creator, mint],
      priorityFees,
      commitment,
      finality
    );

    if (buyAmountSol > 0) {
      for (let i = 0; i < buyers.length; i++) {
        const randomPercent = getRandomInt(10, 25);
        const buyAmountSolWithRandom = buyAmountSol / BigInt(100) * BigInt(randomPercent % 2 ? (100 + randomPercent) : (100 - randomPercent))

        let buyTx = await this.getBuyInstructionsBySolAmount(
          buyers[i].publicKey,
          mint.publicKey,
          buyAmountSolWithRandom,
          slippageBasisPoints,
          commitment
        );

        const buyVersionedTx = await buildTx(
          this.connection,
          buyTx,
          buyers[i].publicKey,
          [buyers[i]],
          priorityFees,
          commitment,
          finality
        );
        buyTxs.push(buyVersionedTx);
      }
    }

    await sendTx(
      this.connection,
      newTx,
      creator.publicKey,
      [creator, mint],
      priorityFees,
      commitment,
      finality
    );
    let result;
    while (1) {
      result = await jitoWithAxios([createVersionedTx, ...buyTxs], creator);
      if (result.confirmed) break;
    }

    return result;
  }

  // 捆绑买入
  async oneCreateAndBuy(
    name: string,
    symbol: string,
    metadata_url: string,
    mint: Keypair,
    wallet: WalletContextState, //主号钱包
    buyAmountSol: bigint, //主号购买数量
    buyers: Keypair[], //小号
    buyAmountSol2: string[], //小号购买数量
    slippageBasisPoints: bigint = 500n,
    jito_url: string,
    jiti_Fee: number,
    commitment: Commitment = DEFAULT_COMMITMENT,
  ): Promise<any> {
    try {
      const transactions: string[] = [];
      const tipAccounts = [
        'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
        'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
        '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
        '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
        'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
        'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
        'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
        'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
      ];
      const jitoTipAccount = new PublicKey(tipAccounts[Math.floor(tipAccounts.length * Math.random())])
      const JITO_FEE = Number(jiti_Fee) * LAMPORTS_PER_SOL; // 小费
      console.log('小费', JITO_FEE)
      //构建创建代币
      const createTx = await this.getCreateInstructions(
        wallet.publicKey,
        name,
        symbol,
        metadata_url,
        mint
      );
      console.log(buyers.length, 'buyers.length')
      const walletTx = new Transaction().add(createTx);
      //主号购买
      const globalAccount = await this.getGlobalAccount(commitment); //账户

      if (buyAmountSol) {
        const buyAmount = globalAccount.getInitialBuyPrice(buyAmountSol); //主号购买数量
        const buyAmountWithSlippage = calculateWithSlippageBuy( //滑点处理
          buyAmountSol,
          slippageBasisPoints
        );
        const buyTx = await this.getBuyInstructions(
          wallet.publicKey,
          mint.publicKey,
          globalAccount.feeRecipient,
          buyAmount,
          buyAmountWithSlippage
        );
        walletTx.add(buyTx)
      }
      console.log('主号购买')
      const signers = [mint] //签名
      let buyTxs: Transaction[] = []; //小号签名
      slippageBasisPoints = 5000n;
      for (let index = 0; index < buyers.length; index++) {
        const buyAmountSol = BigInt(Number(buyAmountSol2[index]) * LAMPORTS_PER_SOL);
        const buyAmount = globalAccount.getInitialBuyPrice(buyAmountSol);
        const buyAmountWithSlippage = calculateWithSlippageBuy(
          buyAmountSol,
          slippageBasisPoints
        );
        const buyTx = await this.getBuyInstructions(
          buyers[index].publicKey,
          mint.publicKey,
          globalAccount.feeRecipient,
          buyAmount,
          buyAmountWithSlippage,
        );
        if (index === 0) {
          walletTx.add(buyTx)
          signers.push(buyers[index])
        } else {
          buyTxs.push(buyTx);
        }
      }
      console.log(((buyers.length + 1) * PUMP_CREATE_FEE), 'fee')
      const fee = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
        lamports: (PUMP_CREATE_FEE) * LAMPORTS_PER_SOL,
      })
      walletTx.add(fee)

      if (buyers.length <= 1) { //只有有个小号钱包，直接购买
        console.log('只有有个小号钱包，直接购买', signers)
        const versionedTx = await addPriorityFees(this.connection, walletTx, wallet.publicKey);
        const _signature = await wallet.sendTransaction(versionedTx, this.connection, { signers })
        const confirmed = await this.connection.confirmTransaction(
          _signature,
          "processed"
        );
        return { type: 'success', message: _signature }
      }

      //捆绑买入 主钱包签名
      const versionedTx = await addPriorityFeesJito(
        this.connection, walletTx, wallet.publicKey,
        jitoTipAccount, JITO_FEE, true)
      versionedTx.sign(signers);

      const signedTx = await wallet.signTransaction(versionedTx); // 使用钱包签名
      const serializedTransaction = signedTx?.serialize();
      const base58EncodedTransaction = base58.encode(
        serializedTransaction as any
      );
      transactions.push(base58EncodedTransaction);

      console.log(buyTxs.length, '小号个数')
      //3个小号一组
      const _buyers = buyers.slice(1)
      const NUM = 4
      for (let j = 0; j < Math.ceil(buyTxs.length / NUM); j++) {
        const _tx = new Transaction();
        const _txs = buyTxs.slice(j * NUM, (j + 1) * NUM)
        _txs.forEach(item => {
          _tx.add(item)
        })
        const versionedTx = await addPriorityFeesJito(
          this.connection, _tx, _buyers[j * NUM].publicKey,
          jitoTipAccount, JITO_FEE, false)
        versionedTx.sign(_buyers.slice(j * NUM, (j + 1) * NUM));
        const serializedTransaction = base58.encode(versionedTx.serialize());
        transactions.push(serializedTransaction);
      }

      const endpoints = `${jito_url}/api/v1/bundles`

      const result = await axios.post(endpoints, {
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [transactions],
      })
      const bundleId = result?.data.result;
      console.log(bundleId, 'bundleId')
      return { type: 'success1', message: bundleId}
    } catch (error: any) {
      return { type: 'err', message: error.message ?? error.toString() }
    }
  }

  async buy(
    buyer: Keypair,
    mint: PublicKey,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = 500n,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT,
    finality: Finality = DEFAULT_FINALITY
  ): Promise<TransactionResult> {
    let buyTx = await this.getBuyInstructionsBySolAmount(
      buyer.publicKey,
      mint,
      buyAmountSol,
      slippageBasisPoints,
      commitment
    );

    let buyResults = await sendTx(
      this.connection,
      buyTx,
      buyer.publicKey,
      [buyer],
      priorityFees,
      commitment,
      finality
    );
    return buyResults;
  }

  async sell(
    seller: Keypair,
    mint: PublicKey,
    sellTokenAmount: bigint,
    slippageBasisPoints: bigint = 500n,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT,
    finality: Finality = DEFAULT_FINALITY
  ): Promise<TransactionResult> {
    let sellTx = await this.getSellInstructionsByTokenAmount(
      seller.publicKey,
      mint,
      sellTokenAmount,
      slippageBasisPoints,
      commitment
    );

    let sellResults = await sendTx(
      this.connection,
      sellTx,
      seller.publicKey,
      [seller],
      priorityFees,
      commitment,
      finality
    );
    return sellResults;
  }

  //create token instructions
  async getCreateInstructions(
    creator: PublicKey,
    name: string,
    symbol: string,
    uri: string,
    mint: Keypair
  ) {
    const mplTokenMetadata = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);

    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(METADATA_SEED),
        mplTokenMetadata.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      mplTokenMetadata
    );

    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint.publicKey,
      this.getBondingCurvePDA(mint.publicKey),
      true
    );

    return this.program.methods
      .create(name, symbol, uri)
      .accounts({
        mint: mint.publicKey,
        associatedBondingCurve: associatedBondingCurve,
        metadata: metadataPDA,
        user: creator,
      })
      .signers([mint])
      .transaction();
  }

  async getBuyInstructionsBySolAmount(
    buyer: PublicKey,
    mint: PublicKey,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = 500n,
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    let bondingCurveAccount = await this.getBondingCurveAccount(
      global_mint,
      commitment
    );
    if (!bondingCurveAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    let buyAmount = bondingCurveAccount.getBuyPrice(buyAmountSol);
    let buyAmountWithSlippage = calculateWithSlippageBuy(
      buyAmountSol,
      slippageBasisPoints
    );
    let globalAccount = await this.getGlobalAccount(commitment);

    return await this.getBuyInstructions(
      buyer,
      mint,
      globalAccount.feeRecipient,
      buyAmount,
      buyAmountWithSlippage,
    );
  }

  //buy
  async getBuyInstructions(
    buyer: PublicKey,
    mint: PublicKey,
    feeRecipient: PublicKey,
    amount: bigint,
    solAmount: bigint,
    commitment: Commitment = DEFAULT_COMMITMENT,
  ) {
    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      this.getBondingCurvePDA(mint),
      true
    );

    const associatedUser = await getAssociatedTokenAddress(mint, buyer, false);

    let transaction = new Transaction();

    try {
      await getAccount(this.connection, associatedUser, commitment);
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
      await this.program.methods
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

    return transaction;
  }

  //sell
  async getSellInstructionsByTokenAmount(
    seller: PublicKey,
    mint: PublicKey,
    sellTokenAmount: bigint,
    slippageBasisPoints: bigint = 500n,
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    let bondingCurveAccount = await this.getBondingCurveAccount(
      mint,
      commitment
    );
    if (!bondingCurveAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    let globalAccount = await this.getGlobalAccount(commitment);

    let minSolOutput = bondingCurveAccount.getSellPrice(
      sellTokenAmount,
      globalAccount.feeBasisPoints
    );

    let sellAmountWithSlippage = calculateWithSlippageSell(
      minSolOutput,
      slippageBasisPoints
    );

    return await this.getSellInstructions(
      seller,
      mint,
      globalAccount.feeRecipient,
      sellTokenAmount,
      sellAmountWithSlippage
    );
  }

  async getSellInstructions(
    seller: PublicKey,
    mint: PublicKey,
    feeRecipient: PublicKey,
    amount: bigint,
    minSolOutput: bigint
  ) {
    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      this.getBondingCurvePDA(mint),
      true
    );

    const associatedUser = await getAssociatedTokenAddress(mint, seller, false);

    let transaction = new Transaction();

    transaction.add(
      await this.program.methods
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

  async getBondingCurveAccount(
    mint: PublicKey,
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    const tokenAccount = await this.connection.getAccountInfo(
      this.getBondingCurvePDA(mint),
      commitment
    );
    if (!tokenAccount) {
      return null;
    }
    return BondingCurveAccount.fromBuffer(tokenAccount!.data);
  }

  async getGlobalAccount(commitment: Commitment = DEFAULT_COMMITMENT) {
    const [globalAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_ACCOUNT_SEED)],
      new PublicKey(PROGRAM_ID)
    );

    const tokenAccount = await this.connection.getAccountInfo(
      globalAccountPDA,
      commitment
    );

    return GlobalAccount.fromBuffer(tokenAccount!.data);
  }

  getBondingCurvePDA(mint: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
      this.program.programId
    )[0];
  }

  //EVENTS
  addEventListener<T extends PumpFunEventType>(
    eventType: T,
    callback: (
      event: PumpFunEventHandlers[T],
      slot: number,
      signature: string
    ) => void
  ) {
    return this.program.addEventListener(
      eventType,
      (event: any, slot: number, signature: string) => {
        let processedEvent;
        switch (eventType) {
          case "createEvent":
            processedEvent = toCreateEvent(event as CreateEvent);
            callback(
              processedEvent as PumpFunEventHandlers[T],
              slot,
              signature
            );
            break;
          case "tradeEvent":
            processedEvent = toTradeEvent(event as TradeEvent);
            callback(
              processedEvent as PumpFunEventHandlers[T],
              slot,
              signature
            );
            break;
          case "completeEvent":
            processedEvent = toCompleteEvent(event as CompleteEvent);
            callback(
              processedEvent as PumpFunEventHandlers[T],
              slot,
              signature
            );
            console.log("completeEvent", event, slot, signature);
            break;
          case "setParamsEvent":
            processedEvent = toSetParamsEvent(event as SetParamsEvent);
            callback(
              processedEvent as PumpFunEventHandlers[T],
              slot,
              signature
            );
            break;
          default:
            console.error("Unhandled event type:", eventType);
        }
      }
    );
  }

  removeEventListener(eventId: number) {
    this.program.removeEventListener(eventId);
  }
}
