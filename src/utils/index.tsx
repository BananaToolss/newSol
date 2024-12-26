import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { isMainnet } from '@/config'

export { default as addPriorityFees } from './addPriorityFees'
export { default as addPriorityFeesJito } from './addPriorityFeesJito'


export const getImage = (imgUrl: string) => new URL(`/src/assets/images/${imgUrl}`, import.meta.url).href

export const fetcher = (args: any) => fetch(args).then((res) => res.json())

export const addressHandler = (address: string) => {
  return address.slice(0, 4) + '...' + address.slice(-6)
}

export const IsAddress = (address: string) => {
  if (address.length !== 44 && address.length !== 43) {
    return false;
  }
  try {
    const decodedAddress = bs58.decode(address);
    new PublicKey(decodedAddress);
    return true;
  } catch (error) {
    return false;
  }
}

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
export function SliceAddress(address: string): string {
  let header = address.slice(0, 4);
  let fooler = address.slice(-4);
  return header + "..." + fooler;
}

// https://solscan.io/tx
export const getTxLink = (signature: string) => {
  let link = 'https://solscan.io/tx/' + signature + '?cluster=devnet'
  if (isMainnet) {
    link = 'https://solscan.io/tx/' + signature
  }
  return link
}

export const getLink = (signature: string) => {
  let link = 'https://solscan.io/' + signature + '?cluster=devnet'
  if (isMainnet) {
    link = 'https://solscan.io/' + signature
  }
  return link
}

export const KEY = 'X_M1zzFXa8tj2YnO'
export const getAllToken_URL = () => {
  let link = 'https://api.shyft.to/sol/v1/wallet/all_tokens?network=devnet&wallet='
  if (isMainnet) {
    link = 'https://api.shyft.to/sol/v1/wallet/all_tokens?network=mainnet-beta&wallet='
  }
  return link
}

export const getTokenInfo = () => {
  let link = 'https://api.shyft.to/sol/v1/token/get_info?network=devnet&token_address='
  if (isMainnet) {
    link = 'https://api.shyft.to/sol/v1/token/get_info?network=mainnet-beta&token_address='
  }
  return link
}


/** 
* 加法运算，避免数据相加小数点后产生多位数和计算精度损失。 
* 
* @param num1加数1 | num2加数2 
*/
export function numAdd(num1, num2) {
  let baseNum, baseNum1, baseNum2;
  try {
    baseNum1 = num1.toString().split(".")[1].length;
  } catch (e) {
    baseNum1 = 0;
  }
  try {
    baseNum2 = num2.toString().split(".")[1].length;
  } catch (e) {
    baseNum2 = 0;
  }
  baseNum = Math.pow(10, Math.max(baseNum1, baseNum2));
  return (num1 * baseNum + num2 * baseNum) / baseNum;
};
