import { useState, useEffect } from 'react';
import { Segmented, Input, Button, message, Flex } from 'antd';
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  getTokenMetadata,
} from "@solana/spl-token";
import { useTranslation } from "react-i18next";
import { Header } from '@/components'
import { Button_Style, BANANATOOLS_ADDRESS, MULTISEND_FEE, Input_Style } from '@/config'
import { IsAddress, getTxLink, numAdd } from '@/utils'
import { Page } from '@/styles';
import type { Token_Type } from '@/type'
import { Modal, Upload,  SelectToken } from '@/components'
import type { TokenDeta_Type } from '@/components/Select'
import { MultisendPage } from './style'


const { TextArea } = Input

interface Receiver_Type {
  receiver: string
  amount: string
}



function Multisend() {
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage()
  const { connection } = useConnection();
  const wallet = useWallet();

  const [transferType, setTransferType] = useState<string | number>(`${t('Airdrop')}SOL`);
  const [textValue, setTextValue] = useState('')
  const [balance, setBalance] = useState('')
  const [totalAccount, setTotalAccount] = useState('')
  const [needAmount, setNeedAmount] = useState('')

  const [isSending, setIsSending] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [nbPerTxAmount, setNbPerTxAmount] = useState('10')

  const [isFile, setIsFile] = useState(false)

  const [senderToken, setSenderToken] = useState<TokenDeta_Type>(null)
  const [token, setToken] = useState<Token_Type>(null)

  useEffect(() => {
    if (wallet && wallet.publicKey) {
      getBalance()
    }
  }, [wallet, connection])

  const textValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextValue(e.target.value)
  }
  //获取余额
  const getBalance = async () => {
    const _balance = await connection.getBalance(wallet.publicKey)
    setBalance((_balance / 1e9).toFixed(3))
  }

  // 自动添加数量
  const autoAmountHandler = (num: string) => {
    const tokenInfo = []
    const token = textValue.split(/[(\r\n)\r\n]+/)
    token.forEach((item) => {
      const arr = item.split(/[,，]+/)
      if (arr[0]) {
        const obj = { Address: arr[0], Amount: num }
        tokenInfo.push(obj)
      }
    })
    uploadFileHandler(tokenInfo)
  }

  // 上传文件得到数据
  const uploadFileHandler = (infoArr: any[]) => {
    const tokenInfo = []
    infoArr.forEach((item) => {
      const str = `${item.Address},${item.Amount}`
      tokenInfo.push(str)
    })
    const inputValue_ = tokenInfo.join('\n')
    setTextValue(inputValue_)
    setIsFile(false)
  }

  // 查看列子
  const viewCases = () => {
    const arr = [
      'HudZWFAUJZVyn5XBXWqtg2hbfVM8343tRA7y8yRLyKT8,1',
      'FcKMVnY963uTp5w5DzirTreJvCNoDNx9hVqT6zPpMdL8,1',
      'B6fWwxnrcEzi4qx1E6bCE18MfZyPz5KvtkXNAHyhaXVE,0.001',
    ]
    const inputValue_ = arr.join('\n')
    setTextValue(inputValue_)
  }

  const nextClick = () => {
    const Receivers: Receiver_Type[] = [];
    let totalAmount = 0
    const _token = textValue.split(/[(\r\n)\r\n]+/)
    _token.forEach((item, index) => {
      const arr = item.split(/[,，]+/)
      const obj = {
        receiver: arr[0],
        amount: arr[1],
      }
      if (!item) return
      if (!IsAddress(obj.receiver)) {
        messageApi.error(`第${index + 1}行 地址：${obj.receiver} 不是合法的地址，将跳过该地址转账`)
      } else if (!obj.amount) {
        messageApi.error(`第${index + 1}行 空投数量为空，将跳过该地址转账`)
      } else {
        Receivers.push(obj);
        totalAmount = numAdd(totalAmount, obj.amount)
      }
    })

    setTotalAccount(Receivers.length.toString())
    setNeedAmount(totalAmount.toString())
    if (Receivers.length == 0) {
      return messageApi.error("Please enter at least one receiver and one amount!");
    }
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

  const [currentTx, setCurrentTx] = useState<number | null>(null);
  const [totalTx, setTotalTx] = useState<number | null>(null);
  //发送
  const senderTransfer = async () => {
    try {
      setSuccess(false);
      setSignature('');
      setError('')

      const Receivers: Receiver_Type[] = [];
      const _token = textValue.split(/[(\r\n)\r\n]+/)
      _token.forEach((item, index) => {
        const arr = item.split(/[,，]+/)
        const obj = {
          receiver: arr[0],
          amount: arr[1],
        }
        if (!item) return
        if (!IsAddress(obj.receiver)) {
          messageApi.error(`第${index + 1}行 地址：${obj.receiver} 不是合法的地址，将跳过该地址转账`)
        } else if (!obj.amount) {
          messageApi.error(`第${index + 1}行 空投数量为空，将跳过该地址转账`)
        } else {
          Receivers.push(obj);
        }
      })

      if (Receivers.length == 0) {
        return messageApi.error("Please enter at least one receiver and one amount!");
      }

      setIsSending(true);
      let from = null
      if (transferType === `${t('Airdrop')}Token`) from = await getAt(new PublicKey(senderToken.address), wallet.publicKey);

      const nbPerTx = Number(nbPerTxAmount);
      let nbTx: number; // 总交易次数
      if (Receivers.length % nbPerTx == 0) {
        nbTx = Receivers.length / nbPerTx;
      } else {
        nbTx = Math.floor(Receivers.length / nbPerTx) + 1;
      }
      setTotalTx(nbTx);
      for (let i = 0; i < nbTx; i++) {
        setCurrentTx(i + 1)
        let Tx = new Transaction();

        let bornSup: number;

        if (i == nbTx - 1) {
          bornSup = Receivers.length;
        } else {
          bornSup = nbPerTx * (i + 1);
        }

        for (let j = nbPerTx * i; j < bornSup; j++) {
          const receiverPubkey = new PublicKey(Receivers[j].receiver);
          const amount = Number(Receivers[j].amount);

          if (transferType === `${t('Airdrop')}SOL`) {
            Tx.add(
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: receiverPubkey,
                lamports: amount * LAMPORTS_PER_SOL,
              })
            );
          } else if (transferType === `${t('Airdrop')}Token`) {
            //获取at
            let to = await getAt(new PublicKey(senderToken.address), receiverPubkey);
            //获取ata
            let ata = await getAta(new PublicKey(senderToken.address), receiverPubkey);
            if (ata == undefined) {
              //创建
              Tx.add(
                createAssociatedTokenAccountInstruction(
                  wallet.publicKey,
                  to,
                  new PublicKey(receiverPubkey),
                  new PublicKey(senderToken.address),
                  TOKEN_PROGRAM_ID,
                  ASSOCIATED_TOKEN_PROGRAM_ID
                )
              );
            }
            //转账
            Tx.add(
              createTransferCheckedInstruction(
                from,
                new PublicKey(senderToken.address),
                to,
                wallet.publicKey,
                amount * 10 ** senderToken.decimals,
                senderToken.decimals
              )
            );
          } else {

          }
        }

        Tx.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(
              BANANATOOLS_ADDRESS
            ),
            lamports: MULTISEND_FEE * LAMPORTS_PER_SOL
          }),
        )
        const signature = await wallet.sendTransaction(Tx, connection);
        const confirmed = await connection.confirmTransaction(
          signature,
          "processed"
        );
        console.log("confirmation", signature);
        setSignature(signature);
      }

      setIsSending(false);
      setSuccess(true);

    } catch (error) {
      console.log(error, 'error')
      setIsSending(false);
      setSuccess(false);
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

  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }

  return (
    <Page>
      {contextHolder}
      <Header title={t('Batch Sender')} hint='同时向多个地址转账,节省Gas费,节省时间' />

      <MultisendPage>
        <div>请选择代币</div>
        <SelectToken callBack={backClick} />


        <div className='flex items-center justify-between mt-5 mb-2' style={{ marginTop: '40px' }}>
          <div>{t('Payment address and quantity')}</div>
          <Modal updata={(_value) => autoAmountHandler(_value)} />
          <div className='auto_color' onClick={() => setIsFile(!isFile)}>{isFile ? t('Manual entry') : t('Upload files')}</div>
        </div>
        {isFile ?
          <Upload uploadFileHandler={uploadFileHandler} /> :
          <TextArea style={{ height: '300px' }}
            value={textValue}
            onChange={textValueChange}
            placeholder={`Hs7tkctve2Ryotetpi5wYwDcSfYAbEbxsDaicbWsHusJ,0.1
GuWnPhdeCvffhmRzkd6qrfPbS2bDDe57SND2uWAtD4b,0.2`} />
        }
        {isFile ?
          <div className='flex justify-between mt-2'>
            <div>{t('Supported file types')}：CSV / Excel / Txt</div>
            <a download href='src/assets/wallets.csv'>
              <div className='auto_color'>{t('Download example')}</div>
            </a>
          </div> :
          <div className='flex justify-between mt-2'>
            <div>{t('Each line includes address and quantity, separated by commas')}</div>
            <div className='auto_color' onClick={viewCases}>{t('View examples')}</div>
          </div>
        }

        <div className='buttonSwapper bw100 mt-5'>
          <Button className={Button_Style} onClick={nextClick}>{t('Next step')}</Button>
        </div>

        {totalAccount &&
          <div>
            <div>{t('The total number of legal addresses for this batch transfer is')}{totalAccount}个</div>
            <div>{t('Total needed')}：{needAmount} {transferType === `${t('Airdrop')}SOL` ? 'SOL' : (senderToken && senderToken.symbol)}</div>
            <div>SOL{t('Balance')}：{balance}</div>
          </div>
        }

        <div className='buttonSwapper bw100'>
          <Button className={Button_Style} onClick={senderTransfer} loading={isSending}>{t('Send transaction')}</Button>
        </div>


        <div className="my-2">
          {isSending && currentTx != null && totalTx != null ? (
            <div className="font-semibold text-xl mt-4 text-teal-500">
              Please confirm Tx: {currentTx}/{totalTx}
            </div>
          ) : (
            <div className="h-[27px]"></div>
          )}
        </div>

        {success && (
          <div className="font-semibold text-xl mt-4">
            ✅ 发送成功!
            <a
              target="_blank"
              rel="noreferrer"
              href={getTxLink(signature)}
            >
              <strong className="underline">点击查看</strong>
            </a>
          </div>
        )}

        {error != "" && (
          <div className="mt-4 font-semibold text-xl">❌ {error}</div>
        )}

      </MultisendPage>
    </Page >
  )
}

export default Multisend