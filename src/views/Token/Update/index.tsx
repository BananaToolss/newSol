import { useState } from 'react'
import { PublicKey } from '@solana/web3.js';
import { Metadata, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { useConnection } from '@solana/wallet-adapter-react';
import { useTranslation } from "react-i18next";
import { Button } from 'antd'
import { Header } from '@/components';
import { getAsset } from '@/utils/sol'
import { Page } from '@/styles';
import { Button_Style, Input_Style } from '@/config'
import { UpdatePage } from './style'

function Update() {
  const { t } = useTranslation()
  const { connection } = useConnection()
  const [tokenAddress, setTokenAddress] = useState('KnAp2ANTEgkWSR5WakFV2PAVkZT1p9qMCRPsSN6ZLS2')

  const getTokenMetadata = async () => {
    try {
      const response = await getAsset(tokenAddress)
      if (response.token_info) {
        const token_info = response.token_info
        const decimals = token_info.decimals
        const supply = token_info.supply
        const freeze_authority = token_info.freeze_authority ?? null
        const mint_authority = token_info.mint_authority ?? null

        console.log(decimals,
          supply, freeze_authority, mint_authority
        )
      }

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
      const metadata = Metadata.deserialize(metadataAccount.data);
      console.log(metadata, 'metadata')
      // console.log(metadata);
      // let logoRes = await fetch(metadata.data.uri);
      // let logoJson = await logoRes.json();
      // console.log(logoJson, 'logoJson')
      // let { image } = logoJson;
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Page>
      <Header title='代币更新'
        hint='已有代币信息快捷更新，帮助您更好的展示代币相关信息，及时完成项目信息迭代' />

      <UpdatePage>
        <div>
          <div>代币合约地址</div>
          <div className='tokenInput'>
            <div className='input'>
              <input type="text" className={Input_Style} placeholder='请输入要更新的代币合约地址'
                value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)}
              />
            </div>
            <div className='buttonSwapper'>
              <Button className={Button_Style}
                onClick={getTokenMetadata} >
                <span>搜索</span>
              </Button>
            </div>
          </div>
        </div>
      </UpdatePage>

    </Page>
  )
}

export default Update