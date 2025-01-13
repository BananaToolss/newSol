import { useState } from 'react'
import { Button, notification, Input, message, Segmented } from 'antd'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useTranslation } from "react-i18next";
import {
  burnChecked, createBurnCheckedInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import type { Token_Type } from '@/type'
import { getAllToken } from '@/utils/newSol'
import { Input_Style, Button_Style, BANANATOOLS_ADDRESS, BURN_FEE } from '@/config'
import type { TOKEN_TYPE, CollocetionType } from '@/type'
import { Page } from '@/styles';
import { Header, SelectToken, Result } from '@/components'
import { BurnPage } from './style'
import { signAllTransactions } from '@metaplex-foundation/umi';
import WalletInfoCollection from './WalletInfoCollection';

const SegmentedOptions = [
  { label: "多钱包", value: 1 },
  { label: "单钱包", value: 2 },

]

function BrunToken() {
  const { t } = useTranslation()
  const [api, contextHolder1] = notification.useNotification();
  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const [token, setToken] = useState<Token_Type>(null)
  const [burnAmount, setBurnAmount] = useState('')
  const [walletConfig, setWalletConfig] = useState<CollocetionType[]>([]) //钱包信息

  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');

  const burnAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBurnAmount(e.target.value)
  }
  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }



  const burnClick = async () => {

  }


  return (
    <Page>
      {contextHolder}
      {contextHolder1}
      <Header title={t('批量关闭账户-回收Solana')}
        hint='Solana上每个Token或NFT都需在首次获取时支付一定的SOL作为账户租金。通过几个简单的步骤，批量销毁您任何不需要的 NFT 或者代币并回收 SOL 租金。' />

      <BurnPage>

        <div className='flex'>
          <Segmented options={SegmentedOptions} size='large' />
          <Button>导入钱包</Button>
        </div>


        <WalletInfoCollection />


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