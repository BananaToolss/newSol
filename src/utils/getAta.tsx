import {
  burnChecked, createBurnCheckedInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount
} from "@solana/spl-token";
import { PublicKey, Connection, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

export const getAt = (mintAccount: PublicKey, walletAccount: PublicKey) => {
  return new Promise(async (resolve: (value: PublicKey) => void, reject) => {
    try {
      let at: PublicKey = await getAssociatedTokenAddress(
        mintAccount,
        walletAccount,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      resolve(at)
    } catch (error) {
      reject(error)
    }
  })
};

export const getAta = (connection: Connection, mintAccount: PublicKey, walletAccount: PublicKey) => {
  return new Promise(async (resolve: (value: PublicKey) => void, reject) => {
    try {
      let ata: PublicKey;
      let at = await getAt(mintAccount, walletAccount);
      ata = (await getAccount(connection, at, undefined, TOKEN_PROGRAM_ID))
        .address;

      resolve(ata)
    } catch (error) {
      reject(error)
    }
  })
};