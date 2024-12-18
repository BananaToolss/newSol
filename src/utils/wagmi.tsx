import { useState, useCallback, useMemo } from 'react'
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Connection } from "@solana/web3.js";
import { createTheme, styled, ThemeProvider } from "@mui/material/styles";
import { SolongWalletAdapter } from "@solana/wallet-adapter-solong";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { WalletModalProvider as ReactUIWalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import "@solana/wallet-adapter-react-ui/styles.css";
import { AutoConnectProvider, useAutoConnect } from './AutoConnectProvider';
import { clusterApiUrl } from '@solana/web3.js';

import { NetworkURL } from "../config";

function Web3Modal({ children }) {

  const { autoConnect } = useAutoConnect();
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolongWalletAdapter(),
    ],
    [network]
  );

  const onError = useCallback(
    (error: WalletError) => {
      console.error(error);
    },
    []
  );

  return (
    <AutoConnectProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} onError={onError} autoConnect={autoConnect}>
          <ReactUIWalletModalProvider>{children}</ReactUIWalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </AutoConnectProvider>
  )
}

export default Web3Modal