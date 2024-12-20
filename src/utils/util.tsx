import {
  getAssociatedTokenAddressSync
} from '@solana/spl-token';

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