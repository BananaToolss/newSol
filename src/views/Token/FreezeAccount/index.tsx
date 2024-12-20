import { useState } from 'react'
import { Button, Checkbox, Input, message } from 'antd'
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
import { Header, SelectToken } from '@/components'
import { BurnPage } from './style'

function BrunToken() {
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [token, setToken] = useState<Token_Type>(null)
  const [burnAmount, setBurnAmount] = useState('')

  const [success, setSuccess] = useState<boolean>(false);
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [signature, setSignature] = useState("");

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
      setSuccess(false);

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
      setSuccess(true);
      messageApi.success('burn success')
    } catch (error) {
      console.log(error)
      setIsBurning(false);
      messageApi.error('error')
    }
  }


  return (
    <Page>
      {contextHolder}
      <Header title={t('冻结账户')} 
      hint='“黑名单”功能，禁止某些帐户执行如发送交易特定操作，有助于防止恶意机器人行为对资产造成损害，并为用户提供更多的控制权以制定更有效的市场策略。' />

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

        <div className="my-2">
          {success ? (
            <>
              <div className="text-[#00FF00]">
                Successfully!
              </div>
              <a target="_blank" href={getTxLink(signature)} rel="noreferrer">
                <strong className="underline">{t('Click to view')}</strong>
              </a>
            </>
          ) : (
            <div className="h-[27px]"></div>
          )}
        </div>
      </BurnPage>
    </Page>
  )
}

export default BrunToken