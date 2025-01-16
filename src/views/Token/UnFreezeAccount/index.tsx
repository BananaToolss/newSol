import { useState } from 'react'
import { Button, notification, Input, message } from 'antd'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useTranslation } from "react-i18next";
import {
  createThawAccountInstruction
} from "@solana/spl-token";
import type { Token_Type } from '@/type'
import { useIsVip } from '@/hooks';
import { Input_Style, Button_Style, BANANATOOLS_ADDRESS, FREE_TOKEN_FEE } from '@/config'
import { getTxLink, addPriorityFees } from '@/utils'
import { getAta } from '@/utils/getAta'
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
  const [freezeAccount, setFreezeAccount] = useState('')
  const vipConfig = useIsVip()

  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');

  const freezeAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFreezeAccount(e.target.value)
  }
  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }

  const freezeAccountClick = async () => {
    try {
      setIsBurning(true);
      setSignature('')
      setError('')

      const _token = new PublicKey(token.address)
      const account = new PublicKey(freezeAccount)
      //派生账户
      let ata: PublicKey = null
      try {
        ata = await getAta(connection, _token, account)
      } catch (error) {
        ata = null
      }
      if (!ata) {
        setIsBurning(false)
        messageApi.error('当前账户中没有该代币，不需要解冻')
        return
      }

      let Tx = new Transaction().add(
        createThawAccountInstruction(
          ata,
          _token,
          publicKey,
        )
      )
      if (!vipConfig.isVip) {
        const fee = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
          lamports: FREE_TOKEN_FEE * LAMPORTS_PER_SOL,
        })
        Tx.add(fee)
      }
      //增加费用，减少失败
      const versionedTx = await addPriorityFees(connection, Tx, publicKey)

      const signature = await sendTransaction(versionedTx, connection);
      const confirmed = await connection.confirmTransaction(
        signature,
        "processed"
      );
      setSignature(signature)
      setIsBurning(false);
      api.success({ message: 'freezeAccount success' })
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
      <Header title={t('解冻账户')}
        hint='“无需代码实现账户权限管理，此功能可恢复特定账户的关键操作，有效解除冻结状态，确保对市场策略的灵活控制和资产的正常运作。' />

      <BurnPage>
        <div >
          <div className='title'>请选择代币</div>
          <SelectToken callBack={backClick} selecToken={token} />
        </div>
        <div className='mt-5 '>
          <div className='title'>解冻地址</div>
          <Input className={Input_Style} placeholder={t('请输入需要解冻的钱包地址')}
            value={freezeAccount} onChange={freezeAccountChange} />
        </div>

        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={freezeAccountClick} loading={isBurning}>确认解冻</Button>
          </div>
          <div className='fee'>全网最低服务费: {vipConfig.isVip ? 0 : FREE_TOKEN_FEE} SOL</div>
        </div>

        <Result signature={signature} error={error} />
      </BurnPage>
    </Page>
  )
}

export default BrunToken