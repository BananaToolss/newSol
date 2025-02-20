
import {
  Connection, PublicKey, SystemProgram, Transaction, Commitment,
  ComputeBudgetProgram, TransactionMessage, VersionedTransaction
} from '@solana/web3.js';

export const DEFAULT_COMMITMENT: Commitment = "finalized";

export const priorityFees = {
  unitLimit: 600000, //250000
  unitPrice: 1_000_000,
  // unitLimit: 500_000,
  // unitPrice: 100_000,
}

const addPriorityFees = (connection: Connection, tx: Transaction, payerKey: PublicKey) => {
  return new Promise(async (resolve: (value: VersionedTransaction) => void, reject) => {
    try {
      // const blockHash = (await connection.getLatestBlockhash(DEFAULT_COMMITMENT))
      //   .blockhash;
      if (priorityFees) {
        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
          units: priorityFees.unitLimit,
        });

        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFees.unitPrice,
        });
        tx.add(modifyComputeUnits);
        tx.add(addPriorityFee);
      }
      
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