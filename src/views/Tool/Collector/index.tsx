import { useState, useEffect, useRef } from 'react'
import { Button, Radio, Segmented, message } from 'antd'
import type { RadioChangeEvent } from 'antd';
import { DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction
} from "@solana/spl-token";
import bs58 from "bs58";
import { useTranslation } from "react-i18next";
import { Page } from '@/styles';
import type { Token_Type } from '@/type'
import type { TOKEN_TYPE, CollocetionType } from '@/type'
import { Input_Style, Button_Style, AUTHORITY_FEE, BANANATOOLS_ADDRESS } from '@/config'
import { IsAddress, getTxLink, addressHandler, fetcher, getImage, getCurrentTimestamp, getLink } from '@/utils'
import { fromSecretKey, printSOLBalance, getSPLBalance } from '@/utils/util'
import { Header, SelectToken, WalletInfoCollection } from '@/components'
import { CollectorPage } from './style'

type walletInfo = {
  walletAddr: string;
  solBalance: number;
  baseTokenBlance: number | undefined;
  targetTokenBalance: number | undefined;
};

interface Test {
  time: string
  data: string
  isHash?: string
  color?: string
}

const ERROR_COLOR = '#ff004d'
const END_COLOR = '#2014cf'
const HASH_COLOR = '#63e2bd'

function Authority() {

  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();
  const { t } = useTranslation()

  const [walletConfig, setWalletConfig] = useState<CollocetionType[]>([]) //钱包信息
  const [collectorAddr, setColletorAddr] = useState('') //归集地址
  const [token, setToken] = useState<Token_Type>(null) //归集代币
  const [modeType, setModeType] = useState(1) //1发送全部 2固定数量 3保留余额
  const [colleAmount, setColleAmount] = useState('') //归集数量
  const [isSending, setIsSending] = useState<boolean>(false);

  const modeTypeChange = (e: RadioChangeEvent) => {
    setModeType(Number(e.target.value))
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
  //获取ata
  const getAta = async (mintAccount: PublicKey, walletAccount: PublicKey) => {
    let ata: PublicKey;
    let at = await getAt(mintAccount, walletAccount);
    try {
      ata = (await getAccount(connection, at, undefined, TOKEN_PROGRAM_ID))
        .address;
      return ata;
    } catch (error) {
      return null;
    }
  };

  const collectorClick = async () => {
    if (!collectorAddr) return messageApi.error('请填写归集接收地址')
    if (!token) return messageApi.error('请选择归集代币')
    if (modeType !== 1 && !colleAmount) return messageApi.error('请输入数量')
    setIsSending(true)
    startCollector(0)
  }

  const startCollector = async (walletIndex: number, isOne?: boolean) => {
    // try {
  
      
    //   let Tx = new Transaction()

    //   const from = Keypair.fromSecretKey(bs58.decode(privateKeys[walletIndex]))
    //   const colleAddr = new PublicKey(collectorAddr)

    //   setLogHandler(`钱包(${addressHandler(from.publicKey.toBase58())}) 开始归集`)

    //   let token: PublicKey = null
    //   if (transferType !== t('Collection SOL') && IsAddress(tokenAddress)) {
    //     token = new PublicKey(tokenAddress)
    //   }

    //   let amount = 0
    //   let tokenAmount = 0
    //   if (transferType === t('Collection SOL')) {
    //     tokenAmount = await printSOLBalance(connection, from.publicKey)
    //   } else {
    //     tokenAmount = await getSPLBalance(connection, token, from.publicKey)
    //   }

    //   //数量判断
    //   if (modeType === 1) { // 归集全部
    //     if (transferType === t('Collection SOL')) {
    //       amount = tokenAmount - 0.000005
    //     } else {
    //       amount = tokenAmount
    //     }
    //   } else if (modeType === 2) { // 归集固定
    //     if (transferType === t('Collection SOL')) {
    //       amount = (0.000005 + Number(colleAmount)) <= tokenAmount ? Number(colleAmount) : 0
    //     } else {
    //       amount = Number(colleAmount) <= tokenAmount ? Number(colleAmount) : 0
    //     }
    //   } else { // 保留余额
    //     if (transferType === t('Collection SOL')) {
    //       amount = tokenAmount - (0.000005 + Number(colleAmount))
    //     } else {
    //       amount = tokenAmount - Number(colleAmount)
    //     }
    //   }
    //   setLogHandler(`归集数量 ${amount} ${transferType === t('Collection SOL') ? 'SOL' : tokenSymbol}`)
    //   //数量判断 跳过钱包
    //   if (amount <= 0) {
    //     if (isOne) {
    //       const _signatureArr = [...signatureArr]
    //       _signatureArr[walletIndex] = 'over'
    //       setSignatureArr(_signatureArr)
    //       setLogHandler('归集执行完成2', END_COLOR)
    //     } else {
    //       setSignatureArr([...signatureArr, 'over'])
    //       setLogHandler('余额不足 跳过改钱包执行')
    //     }
    //     return
    //   }

    //   if (transferType === t('Collection SOL')) { // sol归集
    //     Tx.add(
    //       SystemProgram.transfer({
    //         fromPubkey: from.publicKey,
    //         toPubkey: colleAddr,
    //         lamports: Math.floor(amount * LAMPORTS_PER_SOL),
    //       })
    //     )
    //   } else { // 代币归集
    //     const _from = await getAt(token, from.publicKey);
    //     //获取at
    //     let to = await getAt(token, colleAddr);
    //     //获取ata
    //     let ata = await getAta(token, colleAddr);
    //     if (ata == undefined) {  //创建
    //       Tx.add(
    //         createAssociatedTokenAccountInstruction(
    //           from.publicKey,
    //           to,
    //           colleAddr,
    //           token,
    //           TOKEN_PROGRAM_ID,
    //           ASSOCIATED_TOKEN_PROGRAM_ID
    //         )
    //       );
    //     }
    //     //转账
    //     Tx.add(createTransferInstruction(
    //       _from,
    //       to,
    //       from.publicKey,
    //       amount * 10 ** 9,
    //     ))
    //   }

    //   const signature = await sendAndConfirmTransaction(connection, Tx, [from])
    //   const confirmed = await connection.confirmTransaction(
    //     signature,
    //     "processed"
    //   );
    //   setLogHandler(`归集成功hash ${signature}`, HASH_COLOR, signature)
    //   console.log("confirmation", signature);
    //   if (isOne) {
    //     const _signatureArr = [...signatureArr]
    //     _signatureArr[walletIndex] = signature
    //     setSignatureArr(_signatureArr)
    //     setLogHandler('归集执行完成3', END_COLOR)
    //     updataWallet()
    //   } else {
    //     walletIndex === 0 ? setSignatureArr([signature]) : setSignatureArr([...signatureArr, signature])
    //   }
    // } catch (error) {
    //   console.log(error, 'error')
    //   const err = (error as any)?.message;


    //   if (isOne) {
    //     const _signatureArr = [...signatureArr]
    //     _signatureArr[walletIndex] = 'error'
    //     setSignatureArr(_signatureArr)
    //     setLogHandler('归集执行完成4', END_COLOR)
    //   } else {
    //     walletIndex === 0 ? setSignatureArr(['error']) : setSignatureArr([...signatureArr, 'error'])
    //   }

    //   if (
    //     err.includes(
    //       "Cannot read properties of undefined (reading 'public_keys')"
    //     )
    //   ) {
    //     setLogHandler("It is not a valid Backpack username", ERROR_COLOR)
    //   } else {
    //     setLogHandler(`归集报错${err}`, ERROR_COLOR)
    //   }
    // }
  }

  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }

  return (
    <Page>
      {contextHolder}
      <Header title={t('Batch Collection')} hint='方便快捷地将分散在多个账户中的代币统一归集到一个主账户，提高资金管理的效率，同时减少交易成本和时间。' />

      <CollectorPage className='mt-10 text-center'>
        <div>请选择代币</div>
        <SelectToken callBack={backClick} selecToken={token} />

        <div className='mb-1 mt-5'>{t('Collection receiving address')}</div>
        <input className={Input_Style} placeholder={t('Please enter the wallet address to receive pooled tokens')}
          value={collectorAddr} onChange={(e) => setColletorAddr(e.target.value)} />

        <div className=''>
          <div className='mb-2'>{t('Select collection method')}</div>
          <Radio.Group onChange={modeTypeChange} value={modeType}>
            <Radio value={1}>{t('send all')}</Radio>
            <Radio value={2}>{t('fixed quantity')}</Radio>
            <Radio value={3}>{t('Reserve balance')}</Radio>
          </Radio.Group>
          {modeType === 1 && <div className='hit_c'>{t('Collect all tokens of the imported address')}</div>}
          {modeType === 2 && <div className='hit_c'>{t('Collect a fixed number of tokens. If the balance is insufficient, skip the current wallet.')}</div>}
          {modeType === 3 && <div className='hit_c'>{t('The wallet retains a fixed number of tokens, and if the balance is insufficient, the current wallet is skipped')}</div>}

          {modeType !== 1 &&
            <input className={`${Input_Style} mt-2`} placeholder={t('Please enter quantity')}
              value={colleAmount} onChange={(e) => setColleAmount(e.target.value)} />
          }
        </div>

        <WalletInfoCollection tokenAddr={token ? token.address : null} config={walletConfig} setConfig={setWalletConfig} />


        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={collectorClick} loading={isSending}>{t('Start Collect')}</Button>
          </div>
          <div className='fee'>全网最低服务费: {AUTHORITY_FEE} SOL</div>
        </div>

      </CollectorPage>
    </Page>
  )
}

export default Authority