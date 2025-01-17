import { useState, useEffect } from 'react'
import { Button, notification, Input, message, Segmented, Switch } from 'antd'
import { PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Keypair, TransactionInstruction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useTranslation } from "react-i18next";
import { createCloseAccountInstruction, createBurnCheckedInstruction } from '@solana/spl-token';
import type { Token_Type } from '@/type'
import { getTxLink, addPriorityFees } from '@/utils'
import { printSOLBalance } from '@/utils/util'
import { Input_Style, Button_Style, BANANATOOLS_ADDRESS, CLOSE_FEE, CLOSE_VALUE } from '@/config'
import { Page } from '@/styles';
import { useIsVip } from '@/hooks';
import { Header, SelectToken, Result } from '@/components'
import { BurnPage } from './style'
import { signAllTransactions } from '@metaplex-foundation/umi';
import { getClaimValue } from './WalletInfoCollection'
import WalletInfoCollection from './WalletInfoCollection';
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { base58 } from 'ethers/lib/utils';

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
  const [walletConfig, setWalletConfig] = useState<CloseConfigType[]>([]) //钱包信息
  const [isOptionsAll, setIsOptionsAll] = useState(false)
  const [toAddress, setToAddress] = useState('')
  const vipConfig = useIsVip()
  const [openFee, setOpenFee] = useState(false)
  const [feeConfig, setFeeConfig] = useState({
    key: '',
    address: "",
    solb: ""
  })

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
  useEffect(() => {
    if (feeConfig.key) getFeeConfig()
  }, [feeConfig.key])
  const feeConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeeConfig({ address: '', key: e.target.value, solb: '' })
  }
  const getFeeConfig = async () => {
    const account = Keypair.fromSecretKey(bs58.decode(feeConfig.key))
    const blance = await printSOLBalance(connection, account.publicKey)
    setFeeConfig({ address: account.publicKey.toBase58(), key: feeConfig.key, solb: blance.toString() })
  }
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
    setInfo({ _totalSol: Number(_totalSol.toFixed(6)), _seleNum: Number(_seleNum.toFixed(6)), _seleSol: Number(_seleSol.toFixed(6)) })
  }

  const burnClick = async () => {
    const to = toAddress ? new PublicKey(toAddress) : null
    try {
      if (info._seleNum == 0) return api.info({ message: "请选择需要回收的钱包" })
      setIsBurning(true)
      const _config = walletConfig.filter(item => item.isCheck)
      for (let index = 0; index < _config.length; index++) {
        const account = Keypair.fromSecretKey(bs58.decode(_config[index].privateKey))
        const sigers = []
        const transaction: TransactionInstruction[] = []

        for (let j = 0; j < _config[index].info.length; j++) {
          const accounInfo = _config[index].info[j]
          if (!isOptionsAll) {
            if (Number(accounInfo.balance) === 0) {
              const close = createCloseAccountInstruction(
                new PublicKey(accounInfo.associatedAccount),
                to ? to : account.publicKey, //收款钱包
                account.publicKey
              )
              transaction.push(close)
            }
          } else {
            if (Number(accounInfo.balance) > 0) {
              transaction.push(
                createBurnCheckedInstruction(
                  new PublicKey(accounInfo.associatedAccount),
                  new PublicKey(accounInfo.address),
                  account.publicKey,
                  Number((Number(accounInfo.balance) * (10 ** Number(accounInfo.decimals))).toFixed(0)),
                  accounInfo.decimals,
                )
              )
            }
            transaction.push(createCloseAccountInstruction(
              new PublicKey(accounInfo.associatedAccount),
              to ? to : account.publicKey, //收款钱包,
              account.publicKey
            ))
          }
        }

        const maxLength = isOptionsAll ? 18 : 20
        for (let i = 0; i < Math.ceil(transaction.length / maxLength); i++) {
          let Tx = new Transaction()
          const _trans = transaction.slice(i * maxLength, (i + 1) * maxLength)
          _trans.forEach(item => {
            Tx.add(item)
          })
          const feeValue = Number((_trans.length * CLOSE_VALUE * CLOSE_FEE / 100).toFixed(6))
          let feePayer = account
          if (openFee && feeConfig.key) {
            feePayer = Keypair.fromSecretKey(bs58.decode(feeConfig.key))
          }
          if (!vipConfig.isVip) {
            const fee = SystemProgram.transfer({
              fromPubkey: feePayer.publicKey,
              toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
              lamports: Number(((isOptionsAll ? feeValue / 2 : feeValue) * LAMPORTS_PER_SOL).toFixed(0)),
            })
            Tx.add(fee)
          }
          const latestBlockHash = await connection.getLatestBlockhash();
          Tx.recentBlockhash = latestBlockHash.blockhash;
          Tx.feePayer = feePayer.publicKey;
          sigers.push(account)
          if (openFee && feeConfig.key) {
            sigers.push(feePayer)
          }
          try {
            const singerTrue = await sendAndConfirmTransaction(connection, Tx, sigers, { commitment: 'processed' });
            console.log(singerTrue, 'singerTrue')
          } catch (error) {
            // console.log(error)
            // api.error({ message: error.toString() })
          }
        }
      }
      api.success({ message: "回收完成" })
      setIsBurning(false)
    } catch (error) {
      setIsBurning(false)
      console.log(error, 'error')
      api.error({ message: error.toString() })
    }
  }


  return (
    <Page>
      {contextHolder}
      {contextHolder1}
      <Header title={t('批量关闭账户-回收Solana')}
        hint='Solana上每个Token或NFT都需在首次获取时支付一定的SOL作为账户租金。通过几个简单的步骤，批量销毁您任何不需要的 NFT 或者代币并回收 SOL 租金。' />

      <BurnPage>

        {/* <div className='flex mb-5'>
          <Segmented options={SegmentedOptions} size='large' />
        </div> */}


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

        <div className='mt-3'>
          <div className='flex items-center'>
            <div className='mb-1 mr-2'>代付GAS</div>
            <Switch checked={openFee} onChange={e => setOpenFee(e)} />
          </div>
          {openFee &&
            <>
              <div className=''>
                <div>私钥</div>
                <Input className={Input_Style} placeholder={t('请输入支付gas钱包的私钥')}
                  value={feeConfig.key} onChange={feeConfigChange} name='key' />
              </div>
              <div className='mt-2'>
                <div>钱包地址：{feeConfig.address}</div>
                <div>SOL余额：{feeConfig.solb}</div>
              </div>
            </>
          }
        </div>

        <div className='mt-3'>
          <div className='mb-1'>回收SOL到指定地址</div>
          <Input className={Input_Style} placeholder={t('回收SOL到指定地址，如不填写则回收至对应账户')}
            value={toAddress} onChange={(e) => setToAddress(e.target.value)} />
        </div>

        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={burnClick} loading={isBurning}>开始回收</Button>
          </div>
          <div className='fee'>全网最低服务费: {vipConfig.isVip ? 0 : CLOSE_FEE}%</div>
        </div>

        <Result signature={signature} error={error} />
      </BurnPage>
    </Page>
  )
}

export default BrunToken