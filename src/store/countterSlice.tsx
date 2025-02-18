import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

const initialState = {
  isMainnet: true,
  rpcUrl: 'https://vivianne-g1n6x7-fast-mainnet.helius-rpc.com/',
  // rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=812db19f-55d0-417a-8e7e-0ade8df22075',
  // rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=1ebd5af0-f37c-4aaa-861e-2d8f5e656516'

  // isMainnet: false,
  // rpcUrl: 'https://devnet.helius-rpc.com/?api-key=812db19f-55d0-417a-8e7e-0ade8df22075',
}

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    isMainnetChange: (state, action) => {
      state.isMainnet = action.payload
    },
    rpcUrlChange: (state, action) => {
      state.rpcUrl = action.payload
    },
  },
})

export const {
  isMainnetChange,
  rpcUrlChange
} = counterSlice.actions

// Other code such as selectors can use the imported `RootState` type
export const isMainnet = (state: RootState) => state.isMainnet
export const rpcUrl = (state: RootState) => state.rpcUrl


export default counterSlice.reducer