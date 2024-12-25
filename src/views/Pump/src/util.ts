import {
  Commitment,
  ComputeBudgetProgram,
  Connection,
  Finality,
  Keypair,
  PublicKey,
  SendTransactionError,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  VersionedTransactionResponse,
  SystemProgram,
  TransactionInstruction
} from "@solana/web3.js";
import { WalletContextState } from '@solana/wallet-adapter-react';
import base58 from "bs58";
import { PriorityFee, TransactionResult } from "./types";
import JitoJsonRpcClient from "../jito/src";

export const DEFAULT_COMMITMENT: Commitment = "finalized";
export const DEFAULT_FINALITY: Finality = "finalized";

export const calculateWithSlippageBuy = (
  amount: bigint,
  basisPoints: bigint
) => {
  return amount + (amount * basisPoints) / 10000n;
};

export const calculateWithSlippageSell = (
  amount: bigint,
  basisPoints: bigint
) => {
  return amount - (amount * basisPoints) / 10000n;
};

export async function sendTx(
  connection: Connection,
  tx: Transaction,
  payer: PublicKey,
  signers: Keypair[],
  priorityFees?: PriorityFee,
  commitment: Commitment = DEFAULT_COMMITMENT,
  finality: Finality = DEFAULT_FINALITY
): Promise<TransactionResult> {
  let newTx = new Transaction();

  if (priorityFees) {
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: priorityFees.unitLimit,
    });

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFees.unitPrice,
    });
    newTx.add(modifyComputeUnits);
    newTx.add(addPriorityFee);
  }
  newTx.add(tx);
  let versionedTx = await buildVersionedTx(connection, payer, newTx, commitment);
  versionedTx.sign(signers);
  try {
    console.log((await connection.simulateTransaction(versionedTx, undefined)))

    const sig = await connection.sendTransaction(versionedTx, {
      skipPreflight: false,
    });
    console.log("sig:", `https://solscan.io/tx/${sig}`);

    let txResult = await getTxDetails(connection, sig, commitment, finality);
    if (!txResult) {
      return {
        success: false,
        error: "Transaction failed",
      };
    }
    return {
      success: true,
      signature: sig,
      results: txResult,
    };
  } catch (e) {
    if (e instanceof SendTransactionError) {
      let ste = e as SendTransactionError;
    } else {
      console.error(e);
    }
    return {
      error: e,
      success: false,
    };
  }
}

// 捆绑买入
export async function sendTx2(
  connection: Connection,
  wallet: WalletContextState,
  walletTx: Transaction,
  buyers: Keypair[],
  buyerstxs: Transaction[],
  signers: Keypair[],
  priorityFees?: PriorityFee,
  commitment: Commitment = DEFAULT_COMMITMENT,
  finality: Finality = DEFAULT_FINALITY
): Promise<any> {

  const transactions: string[] = [];
  // const jitoClient = new JitoJsonRpcClient('https://amsterdam.mainnet.block-engine.jito.wtf/api/v1', "");
  // const jitoClient = new JitoJsonRpcClient('https://ny.testnet.block-engine.jito.wtf/api/v1', "");
  // jito测试网
  // connection = new Connection('https://api.testnet.solana.com/');
  // const jitoClient = new JitoJsonRpcClient('https://ny.testnet.block-engine.jito.wtf/api/v1', "");
  const jitoClient = new JitoJsonRpcClient('https://amsterdam.mainnet.block-engine.jito.wtf/api/v1', "");

  // const randomTipAccount = await jitoClient?.getRandomTipAccount();
  // const jitoTipAccount = new PublicKey(randomTipAccount);

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

  const memoProgramId = new PublicKey(
    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
  );

  const jitoTipAmount = Number(0.001) * 10 ** 9; // 小费
  for (let i = 0; i < buyerstxs.length + 1; i++) {
    if (i == 0) {
      const transaction = new Transaction();
      if (priorityFees) {
        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
          units: priorityFees.unitLimit,
        });
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFees.unitPrice,
        });
        transaction.add(modifyComputeUnits);
        transaction.add(addPriorityFee);
      }
      transaction.add(walletTx);
      // Add Jito tip instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: jitoTipAccount,
          lamports: jitoTipAmount,
        })
      );
      // Add memo instruction
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: memoProgramId,
        data: Buffer.from("Hello, Jito!"),
      });
      transaction.add(memoInstruction);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;
      const versionedTx = await buildVersionedTx(
        connection,
        wallet.publicKey,
        transaction,
        commitment
      );

      if (buyers.length > 0) {
        signers.push(buyers[0]);
      }
      versionedTx.sign(signers);
      // 外部调用示例
      const signedTx = await wallet.signTransaction(versionedTx); // 使用钱包签名
      const serializedTransaction = signedTx?.serialize();
      const base58EncodedTransaction = base58.encode(
        serializedTransaction as any
      );
      transactions.push(base58EncodedTransaction);
    } else {
      const newSigners2 = buyers.slice(1);  // 去掉第一个钱包
      const signers3 = newSigners2.slice((i - 1) * 3, (i - 1) * 3 + 3);
      // Crete transaction
      const transaction = new Transaction();

      priorityFees = {
        unitLimit: 500000,
        unitPrice: 1000000,
      };
      if (priorityFees) {
        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
          units: priorityFees.unitLimit,
        });
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFees.unitPrice,
        });
        transaction.add(modifyComputeUnits);
        transaction.add(addPriorityFee);
      }
      // Add transfer instruction
      transaction.add(buyerstxs[i - 1]);
      // Add Jito tip instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: buyers[0].publicKey,
          toPubkey: jitoTipAccount,
          lamports: jitoTipAmount,
        })
      );
      // Add memo instruction
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: memoProgramId,
        data: Buffer.from("Hello, Jito!"),
      });
      transaction.add(memoInstruction);

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = buyers[0].publicKey;
      const versionedTx = await buildVersionedTx(
        connection,
        buyers[0].publicKey,
        transaction,
        commitment
      );
      signers3.push(buyers[0]);
      versionedTx.sign(signers3);

      const serializedTransaction = versionedTx.serialize();
      const base58EncodedTransaction = base58.encode(serializedTransaction);
      transactions.push(base58EncodedTransaction);
    }
  }

  try {
    //使用sendBundle方法发送bundle
    const result = await jitoClient?.sendBundle([transactions]);
    console.log("Bundle send result:", result);
    const bundleId = result?.result;
    console.log("Bundle ID:", bundleId);
    // Wait for confirmation with a longer timeout
    const inflightStatus = await jitoClient?.confirmInflightBundle(
      bundleId,
      180000
    );

    if (inflightStatus.confirmation_status === "confirmed") {
      console.log("Attempting to get bundle status...");
      const finalStatus = await jitoClient?.getBundleStatuses([
        [bundleId],
      ]); // Note the double array
      console.log(
        "Final bundle status response:",
        JSON.stringify(finalStatus, null, 2)
      );

      if (
        finalStatus?.result &&
        finalStatus.result.value &&
        finalStatus.result.value.length > 0
      ) {
        const status = finalStatus.result.value[0];
        console.log("Confirmation status:", status.confirmation_status);

        const explorerUrl = `https://explorer.jito.wtf/bundle/${bundleId}`;
        console.log("Bundle Explorer URL:", explorerUrl);

        console.log("Final bundle details:", status);

        // Updated section to handle and display multiple transactions
        if (status.transactions && status.transactions.length > 0) {
          // 设置状态
          const zt = status.transactions.length;
          console.log(
            `Transaction URLs (${status.transactions.length
            } transaction${status.transactions.length > 1 ? "s" : ""
            } in this bundle):`
          );
          status.transactions.forEach((txId: any, index: any) => {
            const txUrl = `https://solscan.io/tx/${txId}`;
            console.log(`Transaction ${index + 1}: ${txUrl}`);
          });
          if (status.transactions.length === 5) {
            console.log(
              "Note: This bundle has reached the maximum of 5 transactions."
            );
          }
        } else {
          console.log("No transactions found in the bundle status.");
        }
      } else {
        console.log(
          "Unexpected final bundle status response structure"
        );
      }
    } else if (inflightStatus.err) {
      console.log("Bundle processing failed:", inflightStatus.err);
    } else {
      console.log("Unexpected inflight bundle status:", inflightStatus);
    }
  } catch (error) {
    console.error("Error sending or confirming bundle:", error);
  }
}

export async function buildTx(
  connection: Connection,
  tx: Transaction,
  payer: PublicKey,
  signers: Keypair[],
  priorityFees?: PriorityFee,
  commitment: Commitment = DEFAULT_COMMITMENT,
  finality: Finality = DEFAULT_FINALITY
): Promise<VersionedTransaction> {
  let newTx = new Transaction();

  if (priorityFees) {
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: priorityFees.unitLimit,
    });

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFees.unitPrice,
    });
    newTx.add(modifyComputeUnits);
    newTx.add(addPriorityFee);
  }
  newTx.add(tx);
  let versionedTx = await buildVersionedTx(connection, payer, newTx, commitment);
  versionedTx.sign(signers);
  return versionedTx;
}

export const buildVersionedTx = async (
  connection: Connection,
  payer: PublicKey,
  tx: Transaction,
  commitment: Commitment = DEFAULT_COMMITMENT
): Promise<VersionedTransaction> => {
  const blockHash = (await connection.getLatestBlockhash(commitment))
    .blockhash;

  let messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockHash,
    instructions: tx.instructions,
  }).compileToV0Message();

  return new VersionedTransaction(messageV0);
};

export const getTxDetails = async (
  connection: Connection,
  sig: string,
  commitment: Commitment = DEFAULT_COMMITMENT,
  finality: Finality = DEFAULT_FINALITY
): Promise<VersionedTransactionResponse | null> => {
  const latestBlockHash = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    {
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: sig,
    },
    commitment
  );

  return connection.getTransaction(sig, {
    maxSupportedTransactionVersion: 0,
    commitment: finality,
  });
};

export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; // The maximum is inclusive, the minimum is inclusive
}
