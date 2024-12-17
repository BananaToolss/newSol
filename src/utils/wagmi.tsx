import { useState, useEffect, useMemo } from 'react'
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Connection } from "@solana/web3.js";
import { createTheme, styled, ThemeProvider } from "@mui/material/styles";
import { SolongWalletAdapter } from "@solana/wallet-adapter-solong";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import "@solana/wallet-adapter-react-ui/styles.css";


import { NetworkURL } from "../config";

function Web3Modal({ children }) {

  const [networkURL, setNetworkURL] = useState(NetworkURL);
  const [umi, setUmi] = useState(createUmi(new Connection(networkURL)));
  const [endpoint, setEndpoint] = useState(umi.rpc.getEndpoint());

  const defaultTheme = createTheme();
  // const wallets = [new SolongWalletAdapter(), new PhantomWalletAdapter()];

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolongWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter()
    ],
    [networkURL]
  );

  useEffect(() => {
    const newUmi = createUmi(new Connection(networkURL));
    setUmi(newUmi);
    setEndpoint(newUmi.rpc.getEndpoint());
  }, [networkURL]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* <ThemeProvider theme={defaultTheme}> */}
          {/* <SnackbarProvider maxSnack={10}> */}
          {/* <CssBaseline /> */}
          {children}
          {/* </SnackbarProvider> */}
          {/* </ThemeProvider> */}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default Web3Modal