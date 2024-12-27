
import {
  Keypair,
  PublicKey,
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getMint
} from '@solana/spl-token';
import fs from "fs";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

export async function getSPLBalance(
  connection,
  mintAddress,
  pubKey,
  allowOffCurve = false
) {
  try {
    let ata = getAssociatedTokenAddressSync(mintAddress, pubKey, allowOffCurve);
    const balance = await connection.getTokenAccountBalance(ata, "processed");
    return Number(balance.value.uiAmount);
  } catch (e) {
    return 0;
  }
};

export const fromSecretKey = async (item: string) => {
  try {
    const wallet = Keypair.fromSecretKey(bs58.decode(item))
    const address = wallet.publicKey.toBase58()
    return address
  } catch (error) {
    return null
  }
}

export const printSOLBalance = async (
  connection: Connection,
  pubKey: PublicKey,
) => {
  try {
    const balance = await connection.getBalance(pubKey)
    return balance / LAMPORTS_PER_SOL
  } catch (error) {
    return 0
  }
};