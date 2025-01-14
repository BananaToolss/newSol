import { useState } from 'react'
import { Button, Segmented, notification, message, Checkbox } from 'antd'
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Metadata, PROGRAM_ID, DataV2,
  createUpdateMetadataAccountV2Instruction
} from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey, Transaction, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { useTranslation } from "react-i18next";
import { useIsVip } from '@/hooks';
import { getMint, createSetAuthorityInstruction, AuthorityType } from '@solana/spl-token';
import {
  Input_Style, Button_Style, BANANATOOLS_ADDRESS, AUTHORITY_FEE
} from '@/config'
import { getAsset } from '@/utils/sol'
import { Page } from '@/styles';
import { Result } from '@/components'
import { Header } from '@/components'
import { AuthorityPage } from './style'



function Authority() {
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage();
  const [api, contextHolder1] = notification.useNotification();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isSearch, setIsSearch] = useState(false)
  const vipConfig = useIsVip()
  const [tokenAddr, setTokenAddr] = useState('')

  const [isAuthority, setIsAuthority] = useState({ //判断权限
    isFreeze: false,
    isMint: false,
    isMutable: false,
  })

  const [options, setOptions] = useState({
    isFreeze: false,
    isMint: false,
    isMutable: false,
  })

  const [isSending, setIsSending] = useState<boolean>(false);
  const [isUpdata, setIsUpdata] = useState(false)
  const [error, setError] = useState<string>("");
  const [signature, setSignature] = useState<string>("");

  const optionsChange = (checked: boolean, name: string) => {
    setOptions({ ...options, [name]: checked })
  }
  //获取权限信息
  const getTokenInfo = async () => {
    try {
      setIsSearch(true)
      setIsUpdata(false)
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
      console.log(isFreeze, isMint, isMutable)
      setIsAuthority({ isFreeze, isMint, isMutable })
      setIsSearch(false)
      setIsUpdata(true)
    } catch (error) {
      console.log(error)
      messageApi.error('查询错误')
      setIsSearch(false)
    }
  }

  const updateAuthority = async () => {
    try {
      setIsSending(true)
      setSignature('')
      setError('')
      const token = new PublicKey(tokenAddr)
      const tx = new Transaction()
      if (options.isFreeze) {
        const transaction = createSetAuthorityInstruction(
          token,
          publicKey,
          AuthorityType.FreezeAccount,
          null
        )
        tx.add(transaction)
      }
      if (options.isMint) {
        const transaction = createSetAuthorityInstruction(
          token,
          publicKey,
          AuthorityType.MintTokens,
          null
        )
        tx.add(transaction)
      }
      if (options.isMutable) {
        const data = await getAsset(connection, tokenAddr)
        const metadataPDA = PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            PROGRAM_ID.toBuffer(),
            token.toBuffer(),
          ],
          PROGRAM_ID,
        )[0]
        const tokenMetadata = {
          name: data.name,
          symbol: data.symbol,
          uri: data.metadataUrl,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null
        } as DataV2;
        const updateMetadataTransaction = createUpdateMetadataAccountV2Instruction(
          {
            metadata: metadataPDA,
            updateAuthority: publicKey,
          },
          {
            updateMetadataAccountArgsV2: {
              data: tokenMetadata,
              updateAuthority: publicKey,
              primarySaleHappened: true,
              isMutable: false,
            },
          }
        )
        tx.add(updateMetadataTransaction)
      }

      if (!vipConfig.isVip) {
        const fee = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
          lamports: AUTHORITY_FEE * LAMPORTS_PER_SOL,
        })
        tx.add(fee)
      }

      const result = await sendTransaction(tx, connection);
      const confirmed = await connection.confirmTransaction(
        result,
        "processed"
      );
      console.log(confirmed, 'confirmed')
      getTokenInfo()
      setIsSending(false)
      setSignature(result)
      api.success({ message: "success" })
    } catch (error) {
      console.log(error)
      setIsSending(false)
      api.error({ message: error.toString() })
      const err = (error as any)?.message;
      if (
        err.includes(
          "Cannot read properties of undefined (reading 'public_keys')"
        )
      ) {
        setError("It is not a valid Backpack username");
      } else {
        setError(err);
      }
    }
  }


  return (
    <Page>
      {contextHolder}
      {contextHolder1}
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
          <div>
            <div className='auth_title'>{t('Token Information Update Authority')}</div>
            <div className='auti_title1'>{t('Revoking ownership means you will be unable to modify token metadata, which can enhance investor security.')}</div>
          </div>
          {isUpdata &&
            <div className='right'>
              {isAuthority.isMutable ?
                <div className='right_t1'>未放弃</div> :
                <div className='right_t2'>已放弃</div>
              }
              <Checkbox checked={options.isMutable}
                onChange={(e) => optionsChange(e.target.checked, 'isMutable')}
                disabled={!isAuthority.isMutable} />
            </div>
          }
        </div>

        <div className='auth_box'>
          <div>
            <div className='auth_title'>{t('Revoke Freeze Authority')}</div>
            <div className='auti_title1'>{t(`Creating a liquidity pool requires revoking freeze authority. Revoking this authority means you won't be able to freeze tokens in holder wallets.`)}</div>
          </div>
          {isUpdata &&
            <div className='right'>
              {isAuthority.isFreeze ?
                <div className='right_t1'>未放弃</div> :
                <div className='right_t2'>已放弃</div>
              }
              <Checkbox checked={options.isFreeze}
                onChange={(e) => optionsChange(e.target.checked, 'isFreeze')}
                disabled={!isAuthority.isFreeze} />
            </div>
          }
        </div>

        <div className='auth_box'>
          <div>
            <div className='auth_title'>{t('Revoke Mint Authority')}</div>
            <div className='auti_title1'>{t(`Revoking mint authority is necessary for investor confidence and token success. If you revoke this authority, you won't be able to mint additional token supply.`)}</div>
          </div>
          {isUpdata &&
            <div className='right'>
              {isAuthority.isMint ?
                <div className='right_t1'>未放弃</div> :
                <div className='right_t2'>已放弃</div>
              }
              <Checkbox checked={options.isMint}
                onChange={(e) => optionsChange(e.target.checked, 'isMint')}
                disabled={!isAuthority.isMint} />
            </div>
          }
        </div>

        <div className='btn mt-6'>
          <div className='buttonSwapper'>
            <Button className={Button_Style}
              onClick={updateAuthority} loading={isSending}>
              <span>放弃</span>
            </Button>
          </div>
          <div className='fee'>全网最低服务费: {vipConfig.isVip ? 0 : AUTHORITY_FEE} SOL</div>
        </div>


        <Result signature={signature} error={error} />

      </AuthorityPage>
    </Page>
  )
}

export default Authority