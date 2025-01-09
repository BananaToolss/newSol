import { getAssociatedTokenAddressSync, } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import { SOL_TOKEN } from '@/config/Token';
import { fetcher } from '@/utils'

export const getSolPrice = async () => {
  try {
    const url = `https://api.jup.ag/price/v2?ids=${SOL_TOKEN}`
    const resut = await fetcher(url)
    const price = resut.data[SOL_TOKEN].price
    return price
  } catch (error) {
    return '200'
  }
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 两个数之间随机整数 含最大值，含最小值
 * @param min 
 * @param max 
 * @returns number 类型
 */
export function getRandomNumber(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function getSPLBalance(
  connection: Connection,
  mintAddress: PublicKey,
  pubKey: PublicKey,
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

// 获取当前时间并格式化为 YYYY-MM-DD HH:mm:ss
export const getCurrentTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

