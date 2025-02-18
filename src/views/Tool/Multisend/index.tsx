import { useState, useEffect, useMemo } from 'react';
import { Tag, Input, Button, message, Table, TableProps, notification } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
  SimulateTransactionConfig
} from "@solana/web3.js";
import copy from 'copy-to-clipboard';
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
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios'
import { rpcUrl, isMainnet } from '@/store/countterSlice'
import { ethers, BigNumber } from 'ethers'
import { useTranslation } from "react-i18next";
import { Header } from '@/components'
import { isMobile } from 'react-device-detect'
import { useIsVip } from '@/hooks';
import { Button_Style, BANANATOOLS_ADDRESS, MULTISEND_FEE, Input_Style } from '@/config'
import { IsAddress, addPriorityFees, addressHandler, addPriorityFees_no } from '@/utils'
import { Page } from '@/styles';
import type { Token_Type } from '@/type'
import { Modal, Upload, SelectToken, ResultArr, Hint } from '@/components'
import { MultisendPage, SENDINFO, ERROR_PAGE } from './style'
import { SOL } from '@/config/Token';


const { TextArea } = Input

interface Receiver_Type {
  receiver: string
  amount: string
  remove: number,
  state: number //0失败 1成功
  key: number,
  to?: string
}

const nbPerTx = 100 //100个地址签名一次
const SendSolNum = 19
const SendTokenNum = 9

function Multisend() {
  const { t } = useTranslation()
  const [api, contextHolder1] = notification.useNotification();
  const [messageApi, contextHolder] = message.useMessage()
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const _rpcUrl = useSelector(rpcUrl)
  const [textValue, setTextValue] = useState('')
  const [balance, setBalance] = useState('')
  const [needAmount, setNeedAmount] = useState('')
  const [isSending, setIsSending] = useState<boolean>(false);
  const vipConfig = useIsVip()

  const [isFile, setIsFile] = useState(false)
  const [token, setToken] = useState<Token_Type>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [senderConfig, setSenderConfig] = useState<Receiver_Type[]>([])
  const [errorText, setErrorText] = useState([])

  const [currentTx, setCurrentTx] = useState<number | null>(null);
  const [totalTx, setTotalTx] = useState<number | null>(null);
  const [totalSender, setTotalSender] = useState(0)
  const [isSendEnd, setIsSendEnd] = useState(false) //是否全部完成

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
          state: 1,
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

      const NUM = token.address === SOL.address ? SendSolNum : SendTokenNum
      let nbTx: number; // 总签名次数
      let totalTrans = 0
      if (Receivers.length % nbPerTx == 0) {
        nbTx = Receivers.length / nbPerTx;
      } else {
        nbTx = Math.floor(Receivers.length / nbPerTx) + 1;
      }
      setTotalTx(nbTx);
 
      setTotalSender(Math.ceil(Receivers.length / NUM))
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
      if (Number(needAmount) > Number(token.balance)) return api.error({ message: "代币余额不足" })
      setIsSendEnd(false)

      setIsSending(true);

      ///new
      const isSol = token.address === SOL.address ? true : false
      const senderLength = isSol ? 19 : 9

      let Receivers: Receiver_Type[] = []
      let from = null
      if (!isSol) {
        from = await getAt(new PublicKey(token.address), wallet.publicKey);
        for (let index = 0; index < senderConfig.length; index++) {
          let to = await getAt(new PublicKey(token.address), new PublicKey(senderConfig[index].receiver))
          const user = { ...senderConfig[index] }
          user.to = to.toBase58()
          Receivers.push(user)
        }
      } else {
        Receivers = senderConfig
      }
      console.log(Receivers, 'Receivers')

      let Txtotal: VersionedTransaction[] = []
      for (let i = 0; i < Math.ceil(Receivers.length / senderLength); i++) {
        const _Receivers = Receivers.slice(i * senderLength, (i + 1) * senderLength)

        let Tx = new Transaction();
        if (isSol) {
          for (let j = 0; j < _Receivers.length; j++) {
            const receiverPubkey = new PublicKey(_Receivers[j].receiver)
            const amount = Number(_Receivers[j].amount)
            const transfer = SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: receiverPubkey,
              lamports: amount * LAMPORTS_PER_SOL,
            })
            Tx.add(transfer)
          }
        } else {
          const toArr = []
          for (let j = 0; j < _Receivers.length; j++) {
            toArr.push(_Receivers[j].to)
          }
          let _data = JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getMultipleAccounts",
            "params": [
              toArr,
              {
                "encoding": "jsonParsed"
              }
            ]
          });
          let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: _rpcUrl,
            headers: {
              'Content-Type': 'application/json'
            },
            data: _data
          };
          const response = await axios.request(config)
          const value = response.data.result.value

          for (let j = 0; j < _Receivers.length; j++) {
            const receiverPubkey = new PublicKey(_Receivers[j].receiver)
            const amount = Number(_Receivers[j].amount)
            const to = new PublicKey(_Receivers[j].to)
            if (!value[j]) {
              const create = createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                to,
                new PublicKey(receiverPubkey),
                new PublicKey(token.address),
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
              )
              Tx.add(create)
            }
            const tranfer = createTransferCheckedInstruction(
              from,
              new PublicKey(token.address),
              to,
              wallet.publicKey,
              amount * 10 ** token.decimals,
              token.decimals
            )
            Tx.add(tranfer)
          }
        }
        if (!vipConfig.isVip) {
          const fee = SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
            lamports: MULTISEND_FEE * LAMPORTS_PER_SOL,
          })
          Tx.add(fee)
        }
        const versionedTx = await addPriorityFees_no(connection, Tx, publicKey)
        Txtotal.push(versionedTx)
      }
      console.log(Txtotal, 'Txtotal')

      const signedTransactions = await signAllTransactions(Txtotal)
      const config: SimulateTransactionConfig = {
        commitment: 'confirmed'
      }

      const signerArr = []
      const errorArr = []
      console.log('开始')
      for (let index = 0; index < signedTransactions.length; index++) {
        const result = await connection.simulateTransaction(Txtotal[index], config)
        if (result.value.err) {
          console.log(result, '执行报错')
          errorArr.push(index)
        } else {
          const createAccountSignature = await connection.sendRawTransaction(signedTransactions[index].serialize(), { skipPreflight: true })
          console.log(createAccountSignature, 'createAccountSignature', index)
          signerArr.push(createAccountSignature)
        }
      }
      const result = await connection.getSignatureStatuses(signerArr)
      console.log(result, 'result')

      const state = []
      result.value.forEach(item => {
        // state.push(item.err ? 0 : 1)
        state.push(1)
      })
      errorArr.forEach(item => {
        state.splice(item, 0, 0)
      })

      const _config = [...senderConfig]
      state.forEach((item, index) => {
        for (let i = 0; i < senderLength; i++) {
          if (_config[i + index * senderLength]) _config[i + index * senderLength].state = item
        }
      })

      setSenderConfig(_config)
      setIsSendEnd(true)
      setIsSending(false);
      api.success({ message: "执行完成" })
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

  const columns = useMemo(() => {
    const _columns: TableProps['columns'] = [
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

    ];

    const _remove = {
      title: '操作',
      dataIndex: 'remove',
      key: 'remove',
      render: (text) => <a>
        <Button onClick={() => removeClick(Number(text))}>移除</Button>
      </a>
    }
    const _state = {
      title: '状态',
      dataIndex: 'state',
      key: 'state',
      render: (text) => (
        text === 1 ? <Tag color="#568ee6">成功</Tag> : <Tag color="red">失败</Tag>
      )
    }
    isSendEnd ? _columns.push(_state) : _columns.push(_remove)

    return _columns
  }, [isSendEnd])

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

  const backNext = () => {
    setIsSendEnd(false)
    setCurrentIndex(0)
  }

  const isError = useMemo(() => {
    let isError = false
    senderConfig.forEach((item) => {
      if (item.state === 0) isError = true
    })
    return isError
  }, [senderConfig])

  const copyErrClick = () => {
    const errAddr = []
    senderConfig.forEach(item => {
      if (item.state === 0) errAddr.push(item.receiver)
    })
    const _value = errAddr.join('\n')
    copy(_value)
    messageApi.success('copy success')
  }

  return (
    <Page>
      {contextHolder}
      {contextHolder1}
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
              <div className='fee'>全网最低，每批次交易只需要{vipConfig.isVip ? 0 : MULTISEND_FEE}SOL</div>
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
                <div className='fee'>服务费{(vipConfig.isVip ? 0 : MULTISEND_FEE * totalSender)} SOL</div>
                <div className='t1'>代币发送总数</div>
              </div>
              <div className='item'>
                <div className='t2'>{totalSender}</div>
                <div className='t1'>交易总数</div>
              </div>
              <div className='item'>
                <div className='t2'>{Number(token.balance).toFixed(4) ?? ''}</div>
                <div className='t1'>代币余额</div>
              </div>
            </SENDINFO>
            <Table columns={columns} dataSource={senderConfig} bordered />
            {isError && <Button className='errBtn' onClick={copyErrClick}>复制失败地址</Button>}

            <div className='btn mt-6'>
              <div className='buttonSwapper flex items-center justify-center'>
                <div className='back pointer' onClick={backNext}>
                  <ArrowLeftOutlined />
                </div>
                <div className='bw100'>
                  <Button className={Button_Style}
                    onClick={senderTransfer} loading={isSending}>
                    <span>{t('发送')}</span>
                  </Button>
                </div>
              </div>
              <div className='fee'>全网最低，每批次交易只需要{vipConfig.isVip ? 0 : MULTISEND_FEE}SOL</div>
            </div>
          </>
        }
{/* 
        <div className="my-2">
          {isSending && currentTx != null && totalTx != null ? (
            <div className="font-semibold text-xl mt-4 text-teal-500">
              总共需要钱包签名次数: {currentTx}/{totalTx}
            </div>
          ) : (
            <div className="h-[27px]"></div>
          )}
        </div> */}
      </MultisendPage>
    </Page >
  )
}

export default Multisend