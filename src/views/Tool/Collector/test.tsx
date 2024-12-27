
import { getOrCreateAssociatedTokenAccount, createTransferInstruction, Account,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
 } from "new-spl-token";
import { Connection, Keypair, ParsedAccountData, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import bs58 from "bs58";

// const secret = [0, ..., 0]; // 👈 Replace with your secret
const FROM_KEYPAIR = Keypair.fromSecretKey(bs58.decode('5RuruwcxW4KoVCMxAbjF5eadhH8EaXprNweSQn55ze5PSiea1hfu9iLKbVcxVgUkgbx9Jfn4zeyjXTNGK5NvxP8V'));  // 发送者
console.log(`My public key is: ${FROM_KEYPAIR.publicKey.toString()}.`);

const QUICKNODE_RPC = 'https://devnet.helius-rpc.com/?api-key=812db19f-55d0-417a-8e7e-0ade8df22075';
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC);

const DESTINATION_WALLET = '2RgTXG56axGUgHhTzuxAE99YnQXz5ohWucdxhdG4odeF';
const MINT_ADDRESS = '6CjSiVqsfuFRohDgawBEj4xyEoHzDhL92o6DGXnXTStN'; //代币
const TRANSFER_AMOUNT = 1;

async function getNumberDecimals(mintAddress: string): Promise<number> {
  const info = await SOLANA_CONNECTION.getParsedAccountInfo(new PublicKey(MINT_ADDRESS));
  const result = (info.value?.data as ParsedAccountData).parsed.info.decimals as number;
  return result;
}

export async function sendTokens() {
  try {
    console.log(`Sending ${TRANSFER_AMOUNT} ${(MINT_ADDRESS)} from ${(FROM_KEYPAIR.publicKey.toString())} to ${(DESTINATION_WALLET)}.`)
    //Step 1
    console.log(`1 - Getting Source Token Account`);
    let sourceAccount = await getOrCreateAssociatedTokenAccount(
      SOLANA_CONNECTION,
      FROM_KEYPAIR,
      new PublicKey(MINT_ADDRESS),
      FROM_KEYPAIR.publicKey
    );
    console.log(`    Source Account: ${sourceAccount.address.toString()}`);

    const tx = new Transaction();
    //Step 2
    let destinationAccount: Account
    console.log(`2 - Getting Destination Token Account`);
    try {
      destinationAccount = await getOrCreateAssociatedTokenAccount(
        SOLANA_CONNECTION,
        FROM_KEYPAIR,
        new PublicKey(MINT_ADDRESS),
        new PublicKey(DESTINATION_WALLET)
      );
      console.log(destinationAccount, 'destinationAccount')
      console.log(`    Destination Account: ${destinationAccount.address.toString()}`);
    } catch (error) {
      // tx.add(
      //   createAssociatedTokenAccountInstruction(
      //     wallet.publicKey,
      //     to,
      //     colleAddr,
      //     new PublicKey(MINT_ADDRESS),
      //     TOKEN_PROGRAM_ID,
      //     ASSOCIATED_TOKEN_PROGRAM_ID
      //   )
      // );
    }

    //Step 3
    console.log(`3 - Fetching Number of Decimals for Mint: ${MINT_ADDRESS}`);
    const numberDecimals = await getNumberDecimals(MINT_ADDRESS);
    console.log(`    Number of Decimals: ${numberDecimals}`);


    //Step 4
    console.log(`4 - Creating and Sending Transaction`);

    tx.add(createTransferInstruction(
      sourceAccount.address, // 发送者派生账户
      destinationAccount.address, //接收派生账户
      FROM_KEYPAIR.publicKey,
      TRANSFER_AMOUNT * Math.pow(10, numberDecimals)
    ))

    const latestBlockHash = await SOLANA_CONNECTION.getLatestBlockhash('confirmed');
    tx.recentBlockhash = await latestBlockHash.blockhash;
    const signature = await sendAndConfirmTransaction(SOLANA_CONNECTION, tx, [FROM_KEYPAIR]);
    console.log(
      '\x1b[32m', //Green Text
      `   Transaction Success!🎉`,
      `\n    https://explorer.solana.com/tx/${signature}?cluster=devnet`
    );
  } catch (error) {
    console.log(error)
  }
}