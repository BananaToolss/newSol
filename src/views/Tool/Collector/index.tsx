import { useState, useEffect, useMemo } from 'react'
import { Button, Radio, notification, message } from 'antd'
import type { RadioChangeEvent } from 'antd';
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
import { BigNumber, ethers } from 'ethers';
import copy from 'copy-to-clipboard';
import {
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  createTransferCheckedInstruction
} from "@solana/spl-token";
import bs58 from "bs58";
import { useTranslation } from "react-i18next";
import { Page } from '@/styles';
import type { Token_Type } from '@/type'
import type { TOKEN_TYPE, CollocetionType } from '@/type'
import { Input_Style, Button_Style, AUTHORITY_FEE, BANANATOOLS_ADDRESS } from '@/config'
import { Header, SelectToken, WalletInfoCollection, Hint } from '@/components'
import { CollectorPage } from './style'
import base58 from 'bs58';
import { SOL_TOKEN } from '@/config/Token';




const SOLNUM = 8
const TOKENNUM = 6

function Authority() {

  const [api, contextHolder1] = notification.useNotification();
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
    startCollector()
  }

  const startCollector = async () => {
    try {
      const accounts: Keypair[] = [];
      const sendAmounts: number[] = []
      const assiciaAccounts: PublicKey[] = []
      walletConfig.forEach((item, index) => {
        const account = Keypair.fromSecretKey(base58.decode(item.privateKey))
        accounts.push(account)
        assiciaAccounts.push(item.assiciaAccount)
        let balance = walletConfig[index].balance
        if (token.address !== SOL_TOKEN) {
          balance = walletConfig[index].tokenBalance
        }

        let amount = balance
        if (modeType === 2) {
          amount = balance >= Number(colleAmount) ? Number(colleAmount) : 0
        } else if (modeType === 3) {
          const _amount = ethers.utils.parseEther(balance.toString()).sub(ethers.utils.parseEther(colleAmount))
          const amount1 = ethers.utils.formatEther(_amount)
          amount = Number(_amount) > 0 ? Number(amount1) : 0
        }
        sendAmounts.push(amount * (10 ** token.decimals))
      })
      console.log(sendAmounts, 'sendAmounts')
      const toPubkey = new PublicKey(collectorAddr)
      const signerTrueArr: string[] = []

      if (token.address === SOL_TOKEN) {
        for (let i = 0; i < Math.ceil(accounts.length / SOLNUM); i++) {
          const tx = new Transaction();
          const sigers: Keypair[] = [];
          let fee = 0

          const _accounts = accounts.slice(i * SOLNUM, (i + 1) * SOLNUM)
          const _sendAmounts = sendAmounts.slice(i * SOLNUM, (i + 1) * SOLNUM)

          _accounts.forEach((item, index) => {
            let amount = Number(_sendAmounts[index].toFixed(0))
            if (modeType === 1 && index == 0) {
              amount -= _accounts.length * 0.000005 * 10 ** 9
            }
            if (_sendAmounts[index] > 0) {
              const transfer = SystemProgram.transfer({
                fromPubkey: item.publicKey,
                toPubkey: toPubkey,
                lamports: amount
              })
              tx.add(transfer)
              sigers.push(item)
              fee += 1
            }
          })

          tx.feePayer = _accounts[0].publicKey
          // sigers.push(accounts[0])
          const signerTrue = await sendAndConfirmTransaction(connection, tx, sigers, { commitment: "processed" })
          console.log(signerTrue, 'signerTrue')
          signerTrueArr.push(signerTrue)
        }
      } else {
        let to = await getAt(new PublicKey(token.address), toPubkey);
        let ata = await getAta(new PublicKey(token.address), toPubkey);
        if (ata == undefined) {  //创建
          const Tx = new Transaction();
          Tx.add(
            createAssociatedTokenAccountInstruction(
              accounts[0].publicKey,
              to,
              toPubkey,
              new PublicKey(token.address),
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
          const singerTrue = await sendAndConfirmTransaction(connection, Tx, [accounts[0]], { commitment: 'processed', skipPreflight: true });
          console.log(`sig: ${singerTrue}`);
        }
        for (let i = 0; i < Math.ceil(accounts.length / TOKENNUM); i++) {
          const tx = new Transaction();
          const sigers: Keypair[] = [];
          let fee = 0
          const _accounts = accounts.slice(i * TOKENNUM, (i + 1) * TOKENNUM)
          const _sendAmounts = sendAmounts.slice(i * TOKENNUM, (i + 1) * TOKENNUM)
          const _assiciaAccounts = assiciaAccounts.slice(i * TOKENNUM, (i + 1) * TOKENNUM)

          _accounts.forEach((item, index) => {
            if (_sendAmounts[index] > 0) {
              tx.add(createTransferInstruction(
                _assiciaAccounts[index],
                to,
                item.publicKey,
                Number(_sendAmounts[index].toFixed(0)),
              ))
              sigers.push(item)
              fee += 1
            }
          })

          tx.feePayer = _accounts[0].publicKey
          // sigers.push(accounts[0])

          const signerTrue = await sendAndConfirmTransaction(connection, tx, sigers, { commitment: "processed" })
          console.log(signerTrue, 'signerTrue')
          signerTrueArr.push(signerTrue)
        }
      }
      getSignatureState(signerTrueArr)
    } catch (error) {
      console.log(error, 'error')
      setIsSending(false)
      api.error({ message: error.toString() })
    }
  }

  // 最终结果
  const getSignatureState = async (signatures: string[]) => {
    try {
      const result = await connection.getSignatureStatuses(signatures)
      console.log(result, 'result')
      let isAll = true
      const state = []
      result.value.forEach(item => {
        if (!item) isAll = false
      })
      if (isAll) {
        result.value.forEach(item => {
          state.push(item.err ? 2 : 1)
        })
      }
      if (result.value.length !== signatures.length || !isAll) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        getSignatureState(signatures)
      } else {
        const NUM = token.address === SOL_TOKEN ? SOLNUM : TOKENNUM
        const _config = [...walletConfig]
        state.forEach((item, index) => {
          for (let i = 0; i < NUM; i++) {
            if (_config[i + index * NUM]) _config[i + index * NUM].state = item
          }
        })
        setWalletConfig(_config)
        setIsSending(false)
        api.success({ message: "执行完成" })
      }
    } catch (error) {
      console.log(error, 'error')
      setIsSending(false);
      const err = (error as any)?.message;
      api.error({ message: err })
    }
  }

  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }

  const isError = useMemo(() => {
    let isError = false
    walletConfig.forEach((item) => {
      if (item.state === 2) isError = true
    })
    return isError
  }, [walletConfig])


  const copyErrClick = () => {
    const errAddr = []
    walletConfig.forEach(item => {
      if (item.state === 2) errAddr.push(item.privateKey)
    })
    const _value = errAddr.join('\n')
    copy(_value)
    messageApi.success('copy success')
  }

  return (
    <Page>
      {contextHolder}
      {contextHolder1}
      <Header title={t('Batch Collection')} hint='方便快捷地将分散在多个账户中的代币统一归集到一个主账户，提高资金管理的效率，同时减少交易成本和时间。' />

      <CollectorPage className='mt-10 text-center'>
        <div>请选择代币</div>
        <SelectToken callBack={backClick} selecToken={token} />

        <div className='mb-1 mt-5'>{t('Collection receiving address')}</div>
        <input className={Input_Style} placeholder={t('Please enter the wallet address to receive pooled tokens')}
          value={collectorAddr} onChange={(e) => setColletorAddr(e.target.value)} />

        <div className='mt-3'>
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
        {isError && <Button className='errBtn' onClick={copyErrClick}>复制失败地址</Button>}

        <div className='mt-5 infobox'>
          <div className='info_item'>
            <div>地址数量：{walletConfig.length}</div>
            <div>SOL余额：{1}</div>
            <div>代币余额：{1}</div>
          </div>
          <div className='info_item ml-3'>
            <div>所选地址数量：{walletConfig.length}</div>
            <div>所选SOL余额：{1}</div>
            <div>所选代币余额：{1}</div>
          </div>
        </div>

        <Hint title='如果执行失败，请检查 GAS 是否足够，归集代币数量是否大于设置的归集数量。' showClose />

        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={collectorClick} loading={isSending}>{t('Start Collect')}</Button>
          </div>
          <div className='fee'>全网最低服务费: 0 SOL</div>
        </div>

      </CollectorPage>
    </Page>
  )
}

export default Authority