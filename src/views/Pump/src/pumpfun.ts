import {
  Commitment,
  Connection,
  Finality,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Program, Provider } from "@coral-xyz/anchor";
// import { setGlobalDispatcher, Agent } from 'undici'
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
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { BondingCurveAccount } from "./bondingCurveAccount";
import { BN } from "bn.js";
import { addPriorityFees } from '@/utils'
import {
  DEFAULT_COMMITMENT,
  DEFAULT_FINALITY,
  buildTx,
  calculateWithSlippageBuy,
  calculateWithSlippageSell,
  getRandomInt,
  sendTx,
  sendTx2
} from "./util";
import { PumpFun, IDL } from "./IDL";
// import { getUploadedMetadataURI } from "./uploadToIpfs";
import { jitoWithAxios } from "./jitoWithAxios";
import { AnchorWallet, } from "@solana/wallet-adapter-react";
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
    buyers: Keypair[], //小号
    buyAmountSol2: string[], //小号购买数量
    wallet: WalletContextState, //主号钱包
    mint: Keypair,
    createTokenMetadata: CreateTokenMetadata,
    buyAmountSol: bigint, //主号购买数量
    slippageBasisPoints: bigint = 500n,
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT,
    finality: Finality = DEFAULT_FINALITY
  ): Promise<any> {
    try {
      // const tokenMetadata = await this.createTokenMetadata(createTokenMetadata);

      //构建创建代币
      const createTx = await this.getCreateInstructions(
        wallet.publicKey,
        createTokenMetadata.name,
        createTokenMetadata.symbol,
        '',
        mint
      );

      const walletTx = new Transaction().add(createTx);
      //主号购买
      const globalAccount = await this.getGlobalAccount(commitment); //账户
      console.log(globalAccount, 'globalAccount')
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
      const signers = [mint] //签名
      //第一个小号钱包买入
      if (buyers.length > 0) {
        slippageBasisPoints = 5000n;
        const buyAmountSol3 = BigInt(Number(buyAmountSol2[0]) * 10 ** 9);
        const buyAmount2 = globalAccount.getInitialBuyPrice(buyAmountSol3);
        const buyAmountWithSlippage2 = calculateWithSlippageBuy(
          buyAmountSol3,
          slippageBasisPoints
        );
        const buyTx2 = await this.getBuyInstructions(
          buyers[0].publicKey,
          mint.publicKey,
          globalAccount.feeRecipient,
          buyAmount2,
          buyAmountWithSlippage2,
        );
        walletTx.add(buyTx2);
        signers.push(buyers[0])
      }

      // if (buyers.length <= 1) { //只有有个小号钱包，直接购买
      //   const versionedTx = await addPriorityFees(this.connection, walletTx, wallet.publicKey);
      //   const _signature = await wallet.sendTransaction(versionedTx, this.connection, { signers })
      //   console.log(_signature, '_signature')
      //   return
      // }

      const buyerstxs: Transaction[] = []; //除去小号钱包1，其他的钱包购买
      const buyer2 = buyers.slice(1);// 去掉第一个钱包
      if (buyer2.length > 0) {
        // 三个一组
        for (let j = 0; j < Math.ceil(buyer2.length / 3); j++) {
          const tx = new Transaction();
          // 三个叠加
          for (let i = 3 * j; i < buyer2.length; i++) {
            slippageBasisPoints = 5000n;
            const buyAmountSol3 = BigInt(Number(buyAmountSol2[i + 1]) * 10 ** 9);
            const buyAmount2 = globalAccount.getInitialBuyPrice(buyAmountSol3);
            const buyAmountWithSlippage2 = calculateWithSlippageBuy(
              buyAmountSol3,
              slippageBasisPoints
            );
            const buyTx2 = await this.getBuyInstructions(
              buyer2[i].publicKey,
              mint.publicKey,
              globalAccount.feeRecipient,
              buyAmount2,
              buyAmountWithSlippage2,
            );
            tx.add(buyTx2);
            if ((i + 1) % 3 == 0 && i != 0 || i == buyer2.length - 1) {
              buyerstxs.push(tx);
              break;
            }
          }
        }
      }

      // // console.log(txs, "txs");
      await sendTx2(
        this.connection,
        wallet,
        walletTx,
        buyers,
        buyerstxs,
        [mint],
        priorityFees,
        commitment,
        finality
      );
      // return aa;
    } catch (error) {
      console.log(error, 'error1')
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
