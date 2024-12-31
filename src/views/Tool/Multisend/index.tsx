import { useState, useEffect, useMemo } from 'react';
import { Segmented, Input, Button, message, Table, TableProps } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction
} from "@solana/web3.js";
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
import { ethers, BigNumber } from 'ethers'
import { useTranslation } from "react-i18next";
import { Header } from '@/components'
import { useIsMobile } from '@/hooks';
import { Button_Style, BANANATOOLS_ADDRESS, MULTISEND_FEE, Input_Style } from '@/config'
import { IsAddress, addPriorityFees, addressHandler } from '@/utils'
import { Page } from '@/styles';
import type { Token_Type } from '@/type'
import { Modal, Upload, SelectToken, ResultArr, Hint } from '@/components'
import { MultisendPage, SENDINFO, ERROR_PAGE } from './style'
import { SOL } from '@/components/SelectToken/Token';


const { TextArea } = Input

interface Receiver_Type {
  receiver: string
  amount: string
  remove: number,
  key: number
}



function Multisend() {
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage()
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const isMobile = useIsMobile()
  const [textValue, setTextValue] = useState('')
  const [balance, setBalance] = useState('')
  const [needAmount, setNeedAmount] = useState('')
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [signature, setSignature] = useState<string[]>([]);
  const [isFile, setIsFile] = useState(false)
  const [token, setToken] = useState<Token_Type>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [senderConfig, setSenderConfig] = useState<Receiver_Type[]>([])
  const [errorText, setErrorText] = useState([])
  const nbPerTx = 100 //100个地址签名一次
  const [currentTx, setCurrentTx] = useState<number | null>(null);
  const [totalTx, setTotalTx] = useState<number | null>(null);
  const [totalSender, setTotalSender] = useState(0)

  useEffect(() => {
    if (wallet && wallet.publicKey) {
      getBalance()
    }
  }, [wallet, connection])
  useEffect(() => {
    setErrorText([])
  }, [textValue])

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

  //下一步
  const nextClick = () => {
    try {
      if (!token) return messageApi.error('请选择代币')
      setCurrentTx(0)

      const Receivers: Receiver_Type[] = [];
      const tokenInfo = []
      let totalAmount = BigNumber.from('0')
      const _token = textValue.split(/[(\r\n)\r\n]+/)

      const addressArray = []
      _token.forEach(item => {
        if (item) addressArray.push(item.split(/[,，]+/)[0])
      })

      _token.forEach((item, index) => {
        const arr = item.split(/[,，]+/)
        const obj = {
          receiver: arr[0],
          amount: arr.length > 1 ? arr[1] : '0',
          remove: index,
          key: index
        }
        // if (!item) return
        Receivers.push(obj);
        totalAmount = totalAmount.add(ethers.utils.parseEther(obj.amount))

        let fundNum = 0
        addressArray.forEach(item => {
          if (item === arr[0]) fundNum += 1
        })
        if (arr[0] && (!IsAddress(arr[0].trim()) || !arr[1])) {
          tokenInfo.push(`第${index + 1}行：${item} 请输入正确的格式，地址和数量以逗号分隔。例：address,number`)
        } else if (fundNum > 1) {
          tokenInfo.push(`第${index + 1}行：${item} 重复的地址${fundNum}`)
        }
      })

      if (Receivers.length == 0) {
        return messageApi.error("Please enter at least one receiver and one amount!");
      }
      setErrorText(tokenInfo)
      if (tokenInfo.length == 0) {
        setSenderConfig(Receivers)
        setCurrentIndex(1)
        setNeedAmount(ethers.utils.formatEther(totalAmount))
      }

      const NUM = token.address === SOL.address ? 19 : 9
      let nbTx: number; // 总签名次数
      let totalTrans = 0
      if (Receivers.length % nbPerTx == 0) {
        nbTx = Receivers.length / nbPerTx;
      } else {
        nbTx = Math.floor(Receivers.length / nbPerTx) + 1;
      }
      setTotalTx(nbTx);
      //比如201     nbtx = 3
      for (let i = 0; i < nbTx; i++) { //全部地址按100地址分组
        const newReceivers = Receivers.slice(i * nbPerTx, (i + 1) * nbPerTx)
        for (let j = 0; j < newReceivers.length / NUM; j++) {
          totalTrans += 1
        }
      }
      setTotalSender(totalTrans)
    } catch (error) {
      console.log(error, 'error')
      messageApi.error("Please enter at least one receiver and one amount!");
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


  //发送
  const senderTransfer = async () => {
    try {
      setSignature([]);
      setError('')
      const Receivers: Receiver_Type[] = senderConfig;

      setIsSending(true);
      // console.log(Receivers, 'Receivers')
      const NUM = token.address === SOL.address ? 19 : 9
      let nbTx: number; // 总签名次数
      if (Receivers.length % nbPerTx == 0) {
        nbTx = Receivers.length / nbPerTx;
      } else {
        nbTx = Math.floor(Receivers.length / nbPerTx) + 1;
      }
      setTotalTx(nbTx);

      const totalSiner: VersionedTransaction[][] = []
      //比如201     nbtx = 3
      for (let i = 0; i < nbTx; i++) { //全部地址按100地址分组
        let Txtotal: VersionedTransaction[] = []
        const newReceivers = Receivers.slice(i * nbPerTx, (i + 1) * nbPerTx)

        for (let j = 0; j < newReceivers.length / NUM; j++) {
          const _newReceivers = newReceivers.slice(j * NUM, (j + 1) * NUM) //总交易次数

          let Tx = new Transaction();
          for (let index = 0; index < _newReceivers.length; index++) {
            const receiverPubkey = new PublicKey(_newReceivers[index].receiver);
            const amount = Number(_newReceivers[index].amount);
            if (token.address === SOL.address) {
              Tx.add(
                SystemProgram.transfer({
                  fromPubkey: wallet.publicKey,
                  toPubkey: receiverPubkey,
                  lamports: amount * LAMPORTS_PER_SOL,
                })
              );
            } else {
              let from = await getAt(new PublicKey(token.address), wallet.publicKey);
              //获取at
              let to = await getAt(new PublicKey(token.address), receiverPubkey);
              //获取ata
              let ata = await getAta(new PublicKey(token.address), receiverPubkey);
              if (ata == undefined) {
                //创建
                Tx.add(
                  createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    to,
                    new PublicKey(receiverPubkey),
                    new PublicKey(token.address),
                    TOKEN_PROGRAM_ID,
                    ASSOCIATED_TOKEN_PROGRAM_ID
                  )
                );
              }
              //转账
              Tx.add(
                createTransferCheckedInstruction(
                  from,
                  new PublicKey(token.address),
                  to,
                  wallet.publicKey,
                  amount * 10 ** token.decimals,
                  token.decimals
                )
              )
            }
          }
          const fee = SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
            lamports: MULTISEND_FEE * LAMPORTS_PER_SOL,
          })
          Tx.add(fee)
          const versionedTx = await addPriorityFees(connection, Tx, publicKey)

          Txtotal.push(versionedTx)
        }
        console.log(Txtotal, 'Txtotal')
        totalSiner.push(Txtotal)
      }
      signAllTransactions1(totalSiner, 0)
    } catch (error) {
      console.log(error, 'error')
      setIsSending(false);
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

  const signAllTransactions1 = async (totalSiner: VersionedTransaction[][], index: number) => {
    try {
      setCurrentTx(index + 1)
      const signedTransactions = await signAllTransactions(totalSiner[index])
      for (const signedTx of signedTransactions) {
        try {
          const createAccountSignature = await connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: true })
          console.log(createAccountSignature, 'createAccountSignature')
          setSignature((item) => [...item, createAccountSignature])
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error("Transaction failed:", error);
          console.log(error, 'error')
          setIsSending(false);
          const _err = (error as any)?.message;
          setError(_err);
        }
      }
      if (index < totalSiner.length - 1) {
        signAllTransactions1(totalSiner, index + 1)
      } else {
        setIsSending(false);
      }
    } catch (error) {
      console.log(error, 'error')
      setIsSending(false);
      const err = (error as any)?.message;
      setError(err);
    }
  }

  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }

  const columns: TableProps['columns'] = [
    {
      title: '钱包地址',
      dataIndex: 'receiver',
      key: 'receiver',
      render: (text) => <div>{isMobile ? addressHandler(text) : text}</div>
    },
    {
      title: '数量',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: '操作',
      dataIndex: 'remove',
      key: 'remove',
      render: (text) => <a>
        <Button onClick={() => removeClick(Number(text))}>移除</Button>
      </a>
    },
  ];

  const removeClick = (index: number) => {
    console.log(index, 'index')
    const token = textValue.split(/[(\r\n)\r\n]+/)
    token.splice(index, 1)
    const inputValue_ = token.join('\n')
    setTextValue(inputValue_)

    const _senderConfig = [...senderConfig]
    _senderConfig.splice(index, 1)
    setSenderConfig(_senderConfig)
  }



  return (
    <Page>
      {contextHolder}
      <Header title={t('Batch Sender')} hint='同时向多个地址转账,节省Gas费,节省时间' />

      <MultisendPage>
        {currentIndex === 0 ?
          <>
            <div>请选择代币</div>
            <SelectToken callBack={backClick} selecToken={token} />
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

            <Hint title='给新钱包转SOL至少需要0.002SOL来支付账户租金,其他币种则自动扣除0.002SOL,查看SOLANA账户模型' showClose />

            {errorText.length > 0 &&
              <ERROR_PAGE>
                {errorText.map((item, index) => (
                  <div key={index}>{item}</div>
                ))}
              </ERROR_PAGE>
            }


            <div className='btn mt-6'>
              <div className='buttonSwapper'>
                <Button className={Button_Style}
                  onClick={nextClick}>
                  <span>{t('Next step')}</span>
                </Button>
              </div>
              <div className='fee'>全网最低，每批次交易只需要0.008SOL</div>
            </div>
          </> :
          <>
            <SENDINFO>
              <div className='item'>
                <div className='t2'>{senderConfig.length}</div>
                <div className='t1'>地址总数</div>
              </div>
              <div className='item'>
                <div className='t2'>{needAmount}</div>
                <div className='fee'>服务费{(MULTISEND_FEE * totalSender).toFixed(4)} SOL</div>
                <div className='t1'>代币发送总数</div>
              </div>
              <div className='item'>
                <div className='t2'>{totalSender}</div>
                <div className='t1'>交易总数</div>
              </div>
              <div className='item'>
                <div className='t2'>{token.balance ?? ''}</div>
                <div className='t1'>代币余额</div>
              </div>
            </SENDINFO>
            <Table columns={columns} dataSource={senderConfig} bordered />

            <div className='btn mt-6'>
              <div className='buttonSwapper flex items-center justify-center'>
                <div className='back pointer' onClick={() => setCurrentIndex(0)}>
                  <ArrowLeftOutlined />
                </div>
                <div className='bw100'>
                  <Button className={Button_Style}
                    onClick={senderTransfer}>
                    <span>{t('发送')}</span>
                  </Button>
                </div>
              </div>
              <div className='fee'>全网最低，每批次交易只需要{MULTISEND_FEE}SOL</div>
            </div>
          </>
        }



        {/* {totalAccount  &&
          <div>
            <div>{t('The total number of legal addresses for this batch transfer is')} {totalAccount} 个</div>
            <div>{t('Total needed')}：{needAmount} {token.symbol}</div>
            {token.address === SOL.address ?
              <div>SOL{t('Balance')}：{balance}</div> :
              <>
                <div>{token.symbol}余额：{token.balance} </div>
                <div>SOL{t('Balance')}：{balance}</div>
              </>
            }
          </div>
        } */}

        {/* { &&
          <div className='buttonSwapper bw100'>
            <Button className={Button_Style} onClick={senderTransfer} loading={isSending}>{t('Send transaction')}</Button>
          </div>
        } */}


        <div className="my-2">
          {isSending && currentTx != null && totalTx != null ? (
            <div className="font-semibold text-xl mt-4 text-teal-500">
              Please confirm Tx: {currentTx}/{totalTx}
            </div>
          ) : (
            <div className="h-[27px]"></div>
          )}
        </div>

        <ResultArr signature={signature} error={error} />
      </MultisendPage>
    </Page >
  )
}

export default Multisend