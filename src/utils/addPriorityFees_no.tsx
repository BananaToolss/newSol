
import {
  Connection, PublicKey, SystemProgram, Transaction, Commitment,
  ComputeBudgetProgram, TransactionMessage, VersionedTransaction
} from '@solana/web3.js';

export const DEFAULT_COMMITMENT: Commitment = "finalized";

const addPriorityFees = (connection: Connection, tx: Transaction, payerKey: PublicKey) => {
  return new Promise(async (resolve: (value: VersionedTransaction) => void, reject) => {
    try {
      // const blockHash = (await connection.getLatestBlockhash(DEFAULT_COMMITMENT))
      //   .blockhash;
      const { blockhash } = await connection.getLatestBlockhash("processed");
      let messageV0 = new TransactionMessage({
        payerKey: payerKey,
        recentBlockhash: blockhash,
        instructions: tx.instructions,
      }).compileToV0Message();

      let versionedTx = new VersionedTransaction(messageV0);
      resolve(versionedTx)
    } catch (error) {
      reject(error)
    }
  })
}

export default addPriorityFees