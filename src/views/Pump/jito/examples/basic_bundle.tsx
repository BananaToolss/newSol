// const { Connection, PublicKey, Transaction, SystemProgram, ComputeBudgetProgram, Keypair, TransactionInstruction } = require('@solana/web3.js');
// const { JitoJsonRpcClient } = require('../src/index');
// const bs58 = require('bs58');
// const fs = require('fs');


import { Connection, PublicKey, Transaction, SystemProgram, ComputeBudgetProgram, Keypair, TransactionInstruction } from '@solana/web3.js';
import JitoJsonRpcClient from '../src/index';

import base58 from "bs58";

// const fs = require('fs');

export const Main = () => {

  async function basicBundle() {
    // Initialize connection to Solana mainnet
    // https://api.testnet.solana.com/
    // const connection = new Connection('https://api.mainnet-beta.solana.com');
    const connection = new Connection('https://api.testnet.solana.com/');

    // Read wallet from local path
    const walletPath = '/path/to/wallet.json';
    // const walletKeypairData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));

    const walletKeypair = Keypair.fromSecretKey(base58.decode('2Y1g87SGNuW9raycsyDMJXp51WhrN25Scg3G7Nn1DRuYnmHgaeuBa3V97k5eDV1YNqCaCh9xKqd6NLChXyL2NyJk'));
    console.log(walletKeypair, "是多少");
    const ye = await connection.getBalance(walletKeypair.publicKey)
    console.log(ye, "余额");
    // // const walletKeypair = Keypair.fromSecretKey(Uint8Array.from(walletKeypairData));

    // Example with no UUID(default)
    // https://dallas.testnet.block-engine.jito.wtf
    // https://ny.testnet.block-engine.jito.wtf
    // const jitoClient = new JitoJsonRpcClient('https://mainnet.block-engine.jito.wtf/api/v1', "");
    const jitoClient = new JitoJsonRpcClient('https://ny.testnet.block-engine.jito.wtf/api/v1', "");


    // Setup client Jito Block Engine endpoint with UUID
    // const jitoClient = new JitoJsonRpcClient('https://mainnet.block-engine.jito.wtf/api/v1', "UUID-API-KEY");

    // Set up transaction parameters
    const receiver = new PublicKey('D9RSDnx7TuCFj1vgfgr44njeqwGSTBkLs72NUCZhnZ4e');
    const randomTipAccount = await jitoClient.getRandomTipAccount();
    const jitoTipAccount = new PublicKey(randomTipAccount);


    // // Memo program ID
    const memoProgramId = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');


    const transactions: string[] = [];

    for (let i = 0; i < 5; i++) {


      const jitoTipAmount = 300000 + i * 300; // lamports

      const transferAmount = 1000 + i; // lamports

      // // Create transaction
      const transaction = new Transaction();

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletKeypair.publicKey,
          toPubkey: receiver,
          lamports: transferAmount,
        })
      );

      // Add Jito tip instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletKeypair.publicKey,
          toPubkey: jitoTipAccount,
          lamports: jitoTipAmount,
        })
      );

      // Add memo instruction
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: memoProgramId,
        data: Buffer.from('Hello, Jito!'),
      });
      transaction.add(memoInstruction);

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletKeypair.publicKey;

      // Sign the transaction
      transaction.sign(walletKeypair);

      // Serialize and base58 encode the entire signed transaction
      const serializedTransaction = transaction.serialize({ verifySignatures: false });
      const base58EncodedTransaction = base58.encode(serializedTransaction);

      transactions.push(base58EncodedTransaction);
    }

    try {
      //使用sendBundle方法发送bundle
      // const result = await jitoClient.sendBundle([[base58EncodedTransaction]]);
      const result = await jitoClient.sendBundle([transactions]);

      console.log('Bundle send result:', result);

      const bundleId = result.result;
      console.log('Bundle ID:', bundleId);

      // Wait for confirmation with a longer timeout
      const inflightStatus = await jitoClient.confirmInflightBundle(bundleId, 120000); // 120 seconds timeout
      console.log('Inflight bundle status:', JSON.stringify(inflightStatus, null, 2));

      if (inflightStatus.confirmation_status === "confirmed") {
        console.log(`Bundle successfully confirmed on-chain at slot ${inflightStatus.slot}`);

        // Additional check for bundle finalization
        try {
          console.log('Attempting to get bundle status...');
          const finalStatus = await jitoClient.getBundleStatuses([[bundleId]]); // Note the double array
          console.log('Final bundle status response:', JSON.stringify(finalStatus, null, 2));

          if (finalStatus.result && finalStatus.result.value && finalStatus.result.value.length > 0) {
            const status = finalStatus.result.value[0];
            console.log('Confirmation status:', status.confirmation_status);

            const explorerUrl = `https://explorer.jito.wtf/bundle/${bundleId}`;
            console.log('Bundle Explorer URL:', explorerUrl);

            console.log('Final bundle details:', status);

            // Updated section to handle and display multiple transactions
            if (status.transactions && status.transactions.length > 0) {
              console.log(`Transaction URLs (${status.transactions.length} transaction${status.transactions.length > 1 ? 's' : ''} in this bundle):`);
              status.transactions.forEach((txId: any, index: any) => {
                const txUrl = `https://solscan.io/tx/${txId}`;
                console.log(`Transaction ${index + 1}: ${txUrl}`);
              });
              if (status.transactions.length === 5) {
                console.log('Note: This bundle has reached the maximum of 5 transactions.');
              }
            } else {
              console.log('No transactions found in the bundle status.');
            }
          } else {
            console.log('Unexpected final bundle status response structure');
          }
        } catch (statusError) {
          console.error('Error fetching final bundle status:', statusError);

        }
      } else if (inflightStatus.err) {
        console.log('Bundle processing failed:', inflightStatus.err);
      } else {
        console.log('Unexpected inflight bundle status:', inflightStatus);
      }

    } catch (error) {
      console.error('Error sending or confirming bundle:', error);

    }
  }

  // basicBundle().catch(console.error);


  return (
    <div>


      <button onClick={basicBundle}>创建</button>
    </div>
  );

}


export default Main
