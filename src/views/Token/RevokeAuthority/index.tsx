import { useState } from 'react'
import { Button, Segmented, Switch, message } from 'antd'
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { PublicKey, Transaction, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { useTranslation } from "react-i18next";
import { Metadata, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { getMint } from '@solana/spl-token';
import {
  Input_Style, Button_Style,
} from '@/config'
import { Page } from '@/styles';
import { IsAddress, getTxLink, numAdd } from '@/utils'
import { Header } from '@/components'
import { AuthorityPage } from './style'



function Authority() {
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage();
  const wallet = useWallet();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [isSearch, setIsSearch] = useState(false)

  const [tokenAddr, setTokenAddr] = useState('')
  const [transferType, setTransferType] = useState<string | number>(t('Drop permissions'));

  const [isAuthority, setIsAuthority] = useState({ //判断权限
    isFreeze: false,
    isMint: false,
    isMutable: false,
  })
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenDecimals, setTokenDecimals] = useState(9)
  const [options, setOptions] = useState({
    isFreeze: false,
    isMint: false,
    isMutable: false,
  })

  const [isSending, setIsSending] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [signature, setSignature] = useState<string>("");

  const optionsChange = (checked: boolean, name: string) => {
    setOptions({ ...options, [name]: checked })
  }
  //获取权限信息
  const getTokenInfo = async () => {
    try {
      const token = new PublicKey(tokenAddr)
      const tokenMint = new PublicKey(token);
      const metadataPDA = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          PROGRAM_ID.toBuffer(),
          tokenMint.toBuffer(),
        ],
        PROGRAM_ID,
      )[0]
      const metadataAccount = await connection.getAccountInfo(metadataPDA);
      const [metadata, _] = Metadata.deserialize(metadataAccount.data);

      const mintInfo = await getMint(connection, token)

      console.log(mintInfo, metadata)

      const owner = metadata.updateAuthority.toBase58()

      let isFreeze = false
      let isMint = false
      let isMutable = false
      setOptions({ isFreeze, isMint, isMutable })

      if (mintInfo.freezeAuthority &&
        mintInfo.freezeAuthority.toBase58() === owner) {
        isFreeze = true
      }
      if (mintInfo.mintAuthority &&
        mintInfo.mintAuthority.toBase58() === owner) {
        isMint = true
      }
      if (metadata.isMutable) {
        isMutable = true
      }
      setIsAuthority({ isFreeze, isMint, isMutable })
      setTokenSymbol(metadata.data.symbol.split(/\u0000+/)[0])
      setTokenDecimals(mintInfo.decimals)
    } catch (error) {
      console.log(error)
      messageApi.error('查询错误')
    }
  }
  //放弃权限
  const removeAuthority = async () => {

  }

  const [freezeAccount, setFreezeAccount] = useState('')
  //冻结用户
  const freezeAccountHandler = async () => {

  }
  const [mintAmount, setMintAmount] = useState('')
  //铸造代币
  const mintTokenHandler = async () => {

  }

  return (
    <Page>
      {contextHolder}
      <Header title={t('Permission control')} />

      <AuthorityPage>
        <div className='mb-8'>
          <div>代币合约地址</div>
          <div className='tokenInput'>
            <div className='input'>
              <input type="text" className={Input_Style} placeholder='请输入代币合约地址'
                value={tokenAddr} onChange={(e) => setTokenAddr(e.target.value)}
              />
            </div>
            <div className='buttonSwapper'>
              <Button className={Button_Style} loading={isSearch}
                onClick={getTokenInfo} >
                <span>搜索</span>
              </Button>
            </div>
          </div>
        </div>

        <div className='auth_box'>
          <div className='auth_title'>{t('Token Information Update Authority')}</div>
          <div>{t('Revoking ownership means you will be unable to modify token metadata, which can enhance investor security.')}</div>
        </div>

        <div className='auth_box'>
          <div className='auth_title'>{t('Revoke Freeze Authority')}</div>
          <div>{t(`Creating a liquidity pool requires revoking freeze authority. Revoking this authority means you won't be able to freeze tokens in holder wallets.`)}</div>
        </div>

        <div className='auth_box'>
          <div className='auth_title'>{t('Revoke Mint Authority')}</div>
          <div>{t(`Revoking mint authority is necessary for investor confidence and token success. If you revoke this authority, you won't be able to mint additional token supply.`)}</div>
        </div>


        {success && (
          <div className="font-semibold text-xl mt-4">
            ✅ {t('Setup successful !')}
            <a
              target="_blank"
              rel="noreferrer"
              href={getTxLink(signature)}
            >
              <strong className="underline">{t('Click to view')}</strong>
            </a>
          </div>
        )}

        {error != "" && (
          <div className="mt-4 font-semibold text-xl">❌ {error}</div>
        )}
      </AuthorityPage>
    </Page>
  )
}

export default Authority