import { useState } from 'react'
import { Button, notification, Input, message } from 'antd'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useTranslation } from "react-i18next";
import {
  burnChecked, createBurnCheckedInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import type { Token_Type } from '@/components/SelectToken/Token'
import { Input_Style, Button_Style, PROJECT_ADDRESS, BURN_FEE } from '@/config'
import { getTxLink, addPriorityFees } from '@/utils'
import { Page } from '@/styles';
import { Header, SelectToken, Result } from '@/components'
import { BurnPage } from './style'

function BrunToken() {
  const { t } = useTranslation()
  const [api, contextHolder1] = notification.useNotification();
  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [token, setToken] = useState<Token_Type>(null)
  const [burnAmount, setBurnAmount] = useState('')


  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');

  const burnAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBurnAmount(e.target.value)
  }
  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }

  const getAt = async (mintAccount: PublicKey, walletAccount: PublicKey) => {
    let at: PublicKey = await getAssociatedTokenAddress(
      mintAccount,
      walletAccount,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return at;
  };

  const burnClick = async () => {
    try {
      setIsBurning(true);
      setSignature('')
      setError('')

      let Tx = new Transaction();
      const mint = new PublicKey(token.address);
      let account = await getAt(mint, publicKey);
      let _burnAmount = Number(burnAmount) * 10 ** token.decimals

      const burnInstruction = createBurnCheckedInstruction(
        account,
        mint,
        publicKey,
        _burnAmount,
        token.decimals,
      );

      Tx.add(burnInstruction)

      //增加费用，减少失败
      const versionedTx = await addPriorityFees(connection, Tx, publicKey)

      const signature = await sendTransaction(versionedTx, connection);
      const confirmed = await connection.confirmTransaction(
        signature,
        "processed"
      );
      setSignature(signature)
      console.log("confirmation", signature);
      setIsBurning(false);
      api.success({ message: 'burn success' })
    } catch (error) {
      console.log(error)
      setIsBurning(false);
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
      <Header title={t('Burning Tokens')} hint='便捷的永久移除流通中的代币，以提升代币的稀缺性或作为项目承诺的一部分，从而增强您的项目经济模型。' />

      <BurnPage>
        <div >
          <div className='title'>请选择代币</div>
          <SelectToken callBack={backClick} />
        </div>
        <div className='mt-5 '>
          <div className='title'>燃烧数量</div>
          <Input className={Input_Style} placeholder={t('请输入需要燃烧的数量')}
            value={burnAmount} onChange={burnAmountChange} />
        </div>

        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={burnClick} loading={isBurning}>确认燃烧</Button>
          </div>
        </div>

        <Result signature={signature} error={error} />
      </BurnPage>
    </Page>
  )
}

export default BrunToken