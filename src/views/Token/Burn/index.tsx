import { useState } from 'react'
import { Button, Checkbox, message } from 'antd'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useTranslation } from "react-i18next";
import {
  burnChecked, createBurnCheckedInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { Select } from '@/components'
import type { TokenDeta_Type } from '@/components/Select'
import { Input_Style, Button_Style, PROJECT_ADDRESS, BURN_FEE } from '@/config'
import { getTxLink, getLink } from '@/utils'
import { Header } from '@/components'

function BrunToken() {
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [token, setToken] = useState<TokenDeta_Type>(null)
  const [burnAmount, setBurnAmount] = useState('')
  const [isBurnAll, setIsBurnAll] = useState(false)
  const [success, setSuccess] = useState<boolean>(false);
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [signature, setSignature] = useState("");

  const burnAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBurnAmount(e.target.value)
  }
  const backClick = (_token: TokenDeta_Type) => {
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
      const publickey = wallet.publicKey;
      let account = await getAt(mint, wallet.publicKey);

      let _burnAmount = Number(burnAmount) * 10 ** token.decimals
      if (isBurnAll) _burnAmount = Number(token.amount)

      const burnInstruction = createBurnCheckedInstruction(
        account,
        mint,
        publickey,
        _burnAmount,
        token.decimals,
      );

      // const closeInstruction = createCloseAccountInstruction(
      //   account,
      //   publickey,
      //   publickey,
      //   [],
      //   TOKEN_PROGRAM_ID
      // );
      // if (isBurnAll) {
      //   Tx.add(burnInstruction, closeInstruction);
      // } else {
      //   Tx.add(burnInstruction);
      // }

      const fee = SystemProgram.transfer({
        fromPubkey: publickey,
        toPubkey: new PublicKey(PROJECT_ADDRESS),
        lamports: BURN_FEE * LAMPORTS_PER_SOL,
      })
      Tx = Tx.add(fee)
      const signature = await wallet.sendTransaction(Tx, connection);
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
    <div className='page'>
      {contextHolder}
      <Header title={t('Burning Tokens')} />

      <div className='mt-10 mb-8'>
        <Select callBack={backClick} />
      </div>

      {token &&
        <div className='flex justify-center mb-3 cursor-pointer'>
          <div>{token.symbol}</div>
          <div className='ml-3'>{t('Balance')}: {(token.amount / BigInt(10 ** token.decimals)).toString()}</div>
          <div className='ml-3 text-emerald-500 font-bold'>
            <a href={getLink(`token/${token.address}`)} target='_blank'>{t('Browser view')}</a>
          </div>
        </div>
      }

      <div className='buttonSwapper'>
        <input className={Input_Style} placeholder={t('Please enter the quantity to be destroyed')}
          value={burnAmount} onChange={burnAmountChange} />
        <div className='flex items-center justify-center'>
          <Checkbox checked={isBurnAll} onChange={(e) => setIsBurnAll(e.target.checked)} />
          <div className='ml-2'>{t('Destroy all and close accounts')}</div>
          <Button className={Button_Style} onClick={burnClick} loading={isBurning}>{t('Destroy')}</Button>
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
    </div>
  )
}

export default BrunToken