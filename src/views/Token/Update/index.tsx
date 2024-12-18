import { useState } from 'react'
import { PublicKey } from '@solana/web3.js';
import { Metadata, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { useConnection } from '@solana/wallet-adapter-react';
import { useTranslation } from "react-i18next";
import { Button } from 'antd'
import { Page } from '@/styles';
import { Button_Style } from '@/config'

function Update() {
  const { t } = useTranslation()
  const { connection } = useConnection()
  const [tokenAddress, setTokenAddress] = useState('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R')

  const getTokenMetadata = async () => {
    try {
      const tokenMint = new PublicKey(tokenAddress);
      const metadataPDA = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          PROGRAM_ID.toBuffer(),
          tokenMint.toBuffer(),
        ],
        PROGRAM_ID,
      )[0]
      console.log(metadataPDA.toBase58());
      const metadataAccount = await connection.getAccountInfo(metadataPDA);
      console.log(metadataAccount);
      const [metadata, _] = await Metadata.deserialize(metadataAccount.data);
      console.log(metadata);
      let logoRes = await fetch(metadata.data.uri);
      let logoJson = await logoRes.json();
      console.log(logoJson, 'logoJson')
      let { image } = logoJson;
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Page>
      <div className='btn'>
        <div className='buttonSwapper'>
          <Button className={Button_Style}
            onClick={getTokenMetadata} >
            <span>{t('Token Creator')}</span>
          </Button>
        </div>
        <div className='fee'>全网最低服务费:  SOL</div>
      </div>
    </Page>
  )
}

export default Update