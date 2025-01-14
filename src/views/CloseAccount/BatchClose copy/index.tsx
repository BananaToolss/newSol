import { useState } from 'react'
import { Button, notification, Input, message, Segmented } from 'antd'
import { PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useTranslation } from "react-i18next";
import {
  burnChecked, createCloseAccountInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import type { Token_Type } from '@/type'
import { getTxLink, addPriorityFees } from '@/utils'
import { Input_Style, Button_Style, BANANATOOLS_ADDRESS, BURN_FEE, base } from '@/config'
import { Page } from '@/styles';
import { Header, SelectToken, Result } from '@/components'
import { BurnPage } from './style'
import { signAllTransactions } from '@metaplex-foundation/umi';
import WalletInfoCollection from './WalletInfoCollection';
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

const SegmentedOptions = [
  { label: "多钱包", value: 1 },
  { label: "单钱包", value: 2 },
]

export interface ConfigType {
  privateKey: string
  address: string
  allAccount: string
  emptyAccount: string
  value: string
  value1: string
  isCheck: boolean
  state: boolean
  emptyAccounts: any[]
}

function BrunToken() {
  const { t } = useTranslation()
  const [api, contextHolder1] = notification.useNotification();
  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const [token, setToken] = useState<Token_Type>(null)
  const [burnAmount, setBurnAmount] = useState('')
  const [walletConfig, setWalletConfig] = useState<ConfigType[]>([]) //钱包信息

  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');


  const burnClick = async () => {
    try {
      const _config = walletConfig.filter(item => item.isCheck)
      console.log(_config, '_config')
      for (let index = 0; index < _config.length; index++) {
        const emptArr = _config[index].emptyAccounts
        const account = Keypair.fromSecretKey(bs58.decode(_config[index].privateKey))
        let Tx = new Transaction()
        const sigers = []
        for (let j = 0; index < emptArr.length; index++) {
          Tx.add(createCloseAccountInstruction(
            new PublicKey(emptArr[j]),
            publicKey,
            account.publicKey
          ))
        }
        const latestBlockHash = await connection.getLatestBlockhash();
        Tx.recentBlockhash = latestBlockHash.blockhash;
        Tx.feePayer = account.publicKey;
        // sigers.push(wallet2)
        const singerTrue = await sendAndConfirmTransaction(connection, Tx, [account], { commitment: 'processed' });
        console.log(singerTrue, 'singerTrue')
      }
    } catch (error) {
      console.log(error, 'error')
    }
  }


  return (
    <Page>
      {contextHolder}
      {contextHolder1}
      <Header title={t('批量关闭账户-回收Solana')}
        hint='Solana上每个Token或NFT都需在首次获取时支付一定的SOL作为账户租金。通过几个简单的步骤，批量销毁您任何不需要的 NFT 或者代币并回收 SOL 租金。' />

      <BurnPage>

        <div className='flex mb-5'>
          <Segmented options={SegmentedOptions} size='large' />
        </div>


        <WalletInfoCollection config={walletConfig} setConfig={setWalletConfig} />


        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={burnClick} loading={isBurning}>开始回收</Button>
          </div>
          <div className='fee'>全网最低服务费: {BURN_FEE} SOL</div>
        </div>

        <Result signature={signature} error={error} />
      </BurnPage>
    </Page>
  )
}

export default BrunToken