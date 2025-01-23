import { useState } from "react"
import { useDispatch, useSelector } from 'react-redux';
import { rpcUrl, isMainnet } from '@/store/countterSlice'


export const OPENBOOK_PROGRAM_ID_MAINNET = 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'
export const OPENBOOK_PROGRAM_ID_DEVNET = 'EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj'
export const KEY = 'dCV9zeef_E-v4OVl'
export const base = 'https://api.shyft.to'


export const useConfig = () => {
  const _rpcUrl = useSelector(rpcUrl)
  const _isMainnet = useSelector(isMainnet)

  return {
    _rpcUrl,
    _isMainnet,
    OPENBOOK_PROGRAM_ID: _isMainnet ? OPENBOOK_PROGRAM_ID_MAINNET : OPENBOOK_PROGRAM_ID_DEVNET,
    network: _isMainnet ? 'mainnet-beta' : 'devnet'
  }
}