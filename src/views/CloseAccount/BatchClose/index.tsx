import { useState, useEffect } from 'react'
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
import { getClaimValue } from './WalletInfoCollection'
import WalletInfoCollection from './WalletInfoCollection';
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

const SegmentedOptions = [
  { label: "多钱包", value: 1 },
  { label: "单钱包", value: 2 },
]

export interface CloseConfigType {
  account: string
  info: Token_Type[]
  privateKey: string
  emptyNumber: number
  isCheck: boolean
  state: number
}



function BrunToken() {
  const { t } = useTranslation()
  const [api, contextHolder1] = notification.useNotification();
  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const [token, setToken] = useState<Token_Type>(null)
  const [burnAmount, setBurnAmount] = useState('')
  const [walletConfig, setWalletConfig] = useState<CloseConfigType[]>([]) //钱包信息
  const [isOptionsAll, setIsOptionsAll] = useState(false)

  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');

  const [info, setInfo] = useState({
    _totalSol: 0,
    _seleNum: 0,
    _seleSol: 0,
  })

  useEffect(() => {
    getInfo()
  }, [walletConfig, isOptionsAll])

  const getInfo = () => {
    let _totalSol = 0
    let _seleNum = 0
    let _seleSol = 0
    walletConfig.forEach(item => {
      const balance = getClaimValue(item, isOptionsAll)
      _totalSol += Number(balance)
      if (item.isCheck) {
        _seleNum += 1
        _seleSol += Number(balance)
      }
    })
    setInfo({ _totalSol: Number(_totalSol.toFixed(6)), _seleNum: Number(_seleNum.toFixed(6)), _seleSol:Number(_seleSol.toFixed(6)) })
  }

  const burnClick = async () => {
    try {
      // const _config = walletConfig.filter(item => item.isCheck)
      // console.log(_config, '_config')
      // for (let index = 0; index < _config.length; index++) {
      //   const emptArr = _config[index].emptyAccounts
      //   const account = Keypair.fromSecretKey(bs58.decode(_config[index].privateKey))
      //   let Tx = new Transaction()
      //   const sigers = []
      //   for (let j = 0; index < emptArr.length; index++) {
      //     Tx.add(createCloseAccountInstruction(
      //       new PublicKey(emptArr[j]),
      //       publicKey,
      //       account.publicKey
      //     ))
      //   }
      //   const latestBlockHash = await connection.getLatestBlockhash();
      //   Tx.recentBlockhash = latestBlockHash.blockhash;
      //   Tx.feePayer = account.publicKey;
      //   // sigers.push(wallet2)
      //   const singerTrue = await sendAndConfirmTransaction(connection, Tx, [account], { commitment: 'processed' });
      //   console.log(singerTrue, 'singerTrue')
      // }
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


        <WalletInfoCollection isOptionsAll={isOptionsAll} setIsOptionsAll={setIsOptionsAll}
          config={walletConfig} setConfig={setWalletConfig} />

        <div className='mt-5 infobox'>
          <div className='info_item'>
            <div>全部账户数量：{walletConfig.length}</div>
            <div>全部可领取的SOL：{info._totalSol}</div>
          </div>
          <div className='info_item ml-3'>
            <div>所选账户数量：{info._seleNum}</div>
            <div>选中账户可领取的SOL：{info._seleSol}</div>
          </div>
        </div>

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