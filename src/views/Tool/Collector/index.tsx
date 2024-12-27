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
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  getMint,
  createFreezeAccountInstruction,
  createMintToInstruction,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  createTransferInstruction
} from "@solana/spl-token";
import bs58 from "bs58";
import { useTranslation } from "react-i18next";
import { Page } from '@/styles';
import { Input_Style, Button_Style1 as Button_Style, AUTHORITY_FEE, BANANATOOLS_ADDRESS } from '@/config'
import { IsAddress, getTxLink, addressHandler, fetcher, getImage, getCurrentTimestamp, getLink } from '@/utils'
import { fromSecretKey, printSOLBalance, getSPLBalance } from '@/utils/util'
import { Header } from '@/components'
import { CollectorPage } from './style'
import { sendTokens } from './test'

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
  const [privateKeys, setPrivateKeys] = useState([]) //私钥数组
  const [addressArr, setAddressArr] = useState([]) //钱包地址数组
  const [walletsArrInfo, setWalletsArrInfo] = useState<walletInfo[]>([]);

  const [collectorAddr, setColletorAddr] = useState('')

  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('SOL')
  const [tokenDecimals, setTokenDecimals] = useState(9)
  const [tokenImage, setTokenImage] = useState('')

  const [modeType, setModeType] = useState(1)
  const [colleAmount, setColleAmount] = useState('')

  const [isSending, setIsSending] = useState<boolean>(false);
  const [transferType, setTransferType] = useState<string | number>(t('Collection SOL'));

  const [logsArr, setLogsArr] = useState<any[]>([]);
  const newArr = useRef<Test[]>([])
  const [signatureArr, setSignatureArr] = useState([])


  useEffect(() => {
    getAddressArr()
  }, [privateKeys])
  useEffect(() => {
    if (addressArr.length > 0) getWalletInfo(0)
  }, [addressArr, tokenAddress, transferType])
  useEffect(() => {
    if (walletsArrInfo.length > 0) getWalletInfo(walletsArrInfo.length)
  }, [walletsArrInfo])
  useEffect(() => {
    if (IsAddress(tokenAddress)) getTokenInfo()
  }, [tokenAddress])
  useEffect(() => {
    if (signatureArr.length > 0 && isSending) {
      startCollector(signatureArr.length)
    }
  }, [signatureArr])

  const tokenAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenAddress(e.target.value)
  }
  const modeTypeChange = (e: RadioChangeEvent) => {
    setModeType(Number(e.target.value))
  }
  const updateData = () => {
    setLogsArr([...newArr.current]); // 更新 state 以触发重新渲染
  };
  // 日志方法
  const setLogHandler = (data: string, color?: string, isHash?: string,) => {
    newArr.current.push({ time: getCurrentTimestamp(), data, isHash, color });
    updateData();
  }
  const cleanLog = () => {
    setLogsArr([])
    newArr.current = []
    message.success("清除成功");
  };

  const getTokenInfo = async () => {
    // try {
    //   const pad = await programs.metadata.Metadata.getPDA(new PublicKey(tokenAddress))
    //   const metadata = await programs.metadata.Metadata.load(connection, pad)
    //   const mintInfo = await getMint(connection, new PublicKey(tokenAddress))
    //   // const result = await connection.getParsedAccountInfo(new PublicKey('EChH97ge4vsVTjcT4hVtozPNz7y1uWt41tu6VgE3CM3j'))
    //   // console.log(result, 'result')
    //   let uri = metadata.data.data.uri
    //   if (uri) {
    //     const data = await fetcher(uri)
    //     if (data.image) {
    //       uri = data.image
    //     }
    //   }

    //   setTokenSymbol(metadata.data.data.symbol)
    //   setTokenDecimals(mintInfo.decimals)
    //   setTokenImage(uri)
    // } catch (error) {
    //   console.log(error)
    // }
  }

  //**钱包私钥数组 */
  const privateKeyCallBack = (keys: string) => {
    const resultArr = keys.split(/[(\r\n)\r\n]+/)
    const _privateKeys = resultArr.filter((item: string) => item !== '')
    setPrivateKeys(_privateKeys)
    setSignatureArr([])
  }
  //**钱包地址 */
  const getAddressArr = () => {
    if (privateKeys.length === 0) return setAddressArr([])
    const _addressArr = []
    privateKeys.forEach(async (item, index) => {
      const address = await fromSecretKey(item)
      if (address) {
        _addressArr.push(address)
      } else {
        messageApi.error(`第${index + 1}个私钥格式错误，跳过该钱包`)
      }
    })
    setAddressArr(_addressArr) //公钥
  }

  //*更新钱包信息*/
  const updataWallet = () => {
    if (privateKeys.length > 0) getWalletInfo(0)
  }
  const deleteClick = (index: number) => {
    const _keys = [...privateKeys]
    _keys.splice(index, 1)
    setPrivateKeys(_keys)

    const _signatureArr = [...signatureArr]
    _signatureArr.splice(index, 1)
    setSignatureArr(_signatureArr)
  }

  //**获取钱包代币信息 */
  const getWalletInfo = async (index: number) => {
    let solBalance = 0
    let baseTokenBlance = 0
    let targetTokenBalance = 0
    let _walletAddr = addressArr[index]
    if (!_walletAddr) return
    let walletAddr = new PublicKey(_walletAddr)

    solBalance = await printSOLBalance(connection, walletAddr)

    if (transferType === t('Collection SOL')) {
      baseTokenBlance = solBalance
    } else {
      if (IsAddress(tokenAddress)) {
        baseTokenBlance = await getSPLBalance(connection, new PublicKey(tokenAddress), walletAddr)
      }
    }

    const _info = {
      walletAddr: _walletAddr,
      solBalance,
      baseTokenBlance,
      targetTokenBalance
    }
    index === 0 ? setWalletsArrInfo([_info]) : setWalletsArrInfo([...walletsArrInfo, _info])
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
    if (transferType !== t('Collection SOL') && !tokenAddress) return messageApi.error('请输入归集代币地址')
    if (modeType !== 1 && !colleAmount) return messageApi.error('请输入数量')
    setIsSending(true)
    setSignatureArr([])
    startCollector(0)
  }

  const startCollector = async (walletIndex: number, isOne?: boolean) => {
    try {
      if (walletIndex >= privateKeys.length) {
        setLogHandler('归集执行完成1', END_COLOR)
        setIsSending(false)
        updataWallet()
        return
      }
      if (isOne) {
        const _signatureArr = [...signatureArr]
        _signatureArr[walletIndex] = ''
        setSignatureArr(_signatureArr)
      }

      let Tx = new Transaction()

      const from = Keypair.fromSecretKey(bs58.decode(privateKeys[walletIndex]))
      const colleAddr = new PublicKey(collectorAddr)

      setLogHandler(`钱包(${addressHandler(from.publicKey.toBase58())}) 开始归集`)

      let token: PublicKey = null
      if (transferType !== t('Collection SOL') && IsAddress(tokenAddress)) {
        token = new PublicKey(tokenAddress)
      }

      let amount = 0
      let tokenAmount = 0
      if (transferType === t('Collection SOL')) {
        tokenAmount = await printSOLBalance(connection, from.publicKey)
      } else {
        tokenAmount = await getSPLBalance(connection, token, from.publicKey)
      }

      //数量判断
      if (modeType === 1) { // 归集全部
        if (transferType === t('Collection SOL')) {
          amount = tokenAmount - 0.000005
        } else {
          amount = tokenAmount
        }
      } else if (modeType === 2) { // 归集固定
        if (transferType === t('Collection SOL')) {
          amount = (0.000005 + Number(colleAmount)) <= tokenAmount ? Number(colleAmount) : 0
        } else {
          amount = Number(colleAmount) <= tokenAmount ? Number(colleAmount) : 0
        }
      } else { // 保留余额
        if (transferType === t('Collection SOL')) {
          amount = tokenAmount - (0.000005 + Number(colleAmount))
        } else {
          amount = tokenAmount - Number(colleAmount)
        }
      }
      setLogHandler(`归集数量 ${amount} ${transferType === t('Collection SOL') ? 'SOL' : tokenSymbol}`)
      //数量判断 跳过钱包
      if (amount <= 0) {
        if (isOne) {
          const _signatureArr = [...signatureArr]
          _signatureArr[walletIndex] = 'over'
          setSignatureArr(_signatureArr)
          setLogHandler('归集执行完成2', END_COLOR)
        } else {
          setSignatureArr([...signatureArr, 'over'])
          setLogHandler('余额不足 跳过改钱包执行')
        }
        return
      }

      if (transferType === t('Collection SOL')) { // sol归集
        Tx.add(
          SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: colleAddr,
            lamports: Math.floor(amount * LAMPORTS_PER_SOL),
          })
        )
      } else { // 代币归集
        const _from = await getAt(token, from.publicKey);
        //获取at
        let to = await getAt(token, colleAddr);
        //获取ata
        let ata = await getAta(token, colleAddr);
        if (ata == undefined) {  //创建
          Tx.add(
            createAssociatedTokenAccountInstruction(
              from.publicKey,
              to,
              colleAddr,
              token,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }
        //转账
        Tx.add(createTransferInstruction(
          _from,
          to,
          from.publicKey,
          amount * 10 ** tokenDecimals,
        ))
      }

      const signature = await sendAndConfirmTransaction(connection, Tx, [from])
      const confirmed = await connection.confirmTransaction(
        signature,
        "processed"
      );
      setLogHandler(`归集成功hash ${signature}`, HASH_COLOR, signature)
      console.log("confirmation", signature);
      if (isOne) {
        const _signatureArr = [...signatureArr]
        _signatureArr[walletIndex] = signature
        setSignatureArr(_signatureArr)
        setLogHandler('归集执行完成3', END_COLOR)
        updataWallet()
      } else {
        walletIndex === 0 ? setSignatureArr([signature]) : setSignatureArr([...signatureArr, signature])
      }
    } catch (error) {
      console.log(error, 'error')
      const err = (error as any)?.message;


      if (isOne) {
        const _signatureArr = [...signatureArr]
        _signatureArr[walletIndex] = 'error'
        setSignatureArr(_signatureArr)
        setLogHandler('归集执行完成4', END_COLOR)
      } else {
        walletIndex === 0 ? setSignatureArr(['error']) : setSignatureArr([...signatureArr, 'error'])
      }

      if (
        err.includes(
          "Cannot read properties of undefined (reading 'public_keys')"
        )
      ) {
        setLogHandler("It is not a valid Backpack username", ERROR_COLOR)
      } else {
        setLogHandler(`归集报错${err}`, ERROR_COLOR)
      }
    }
  }

  const transferTypeChange = (e: any) => {
    setTransferType(e)
    if (e === t('Collection SOL')) {
      setTokenDecimals(9)
      setTokenSymbol('SOL')
      setTokenImage('')
    } else {
      if (tokenAddress) getTokenInfo()
    }
  }

  return (
    <Page>
      {contextHolder}
      <Header title={t('Batch Collection')} />

      <CollectorPage className='mt-10 text-center'>

        <div className='segmentd'>
          <Segmented options={[t('Collection SOL'), t('Collection Token')]}
            value={transferType} onChange={transferTypeChange}
            size='large' />
        </div>
        {transferType !== t('Collection SOL') &&
          <>
            <div className='flex items-center mb-1 mt-5'>
              <div className='font-bold'>{t('Collect tokens')}</div>
            </div>
            <input className={Input_Style} placeholder={t('Please enter the contract address of the pooled tokens')}
              value={tokenAddress} onChange={tokenAddressChange} />
          </>
        }

        <div className='flex items-center mt-2'>
          <div>
            <img src={tokenImage ? tokenImage : getImage('sol.png')} width={40} height={40} />
          </div>
          <div className='ml-2 mr-2'>{t('Token Symbol')}:{tokenSymbol}</div>
          <div>{t('Token Decimals')}:{tokenDecimals}</div>
        </div>

        <div className='mb-1 font-bold mt-5'>{t('Collection receiving address')}</div>
        <input className={Input_Style} placeholder={t('Please enter the wallet address to receive pooled tokens')}
          value={collectorAddr} onChange={(e) => setColletorAddr(e.target.value)} />

        <div className='buttonSwapper mt-3 flex'>

          <Button className={Button_Style} onClick={updataWallet} >{t('Refresh wallet')}</Button>
        </div>
        <div className='flex mt-3 wallet_item'>
          <div className='w-1/5 text-center'>{t('Address')}</div>
          <div className='w-1/5 text-center'>sol{t('Balance')}</div>
          <div className='w-1/5 text-center'>{t('Collect tokens')}{tokenSymbol}</div>
          <div className='w-1/5 text-center'>{t('Execution result')}</div>
          <div className='w-1/5 text-center'>{t('operate')}</div>
        </div>

        <div className='swap_wallet'>
          {addressArr.map((item, index) => (
            <div className='flex wallet_item' key={index}>
              <div className='w-1/5 text-center'>{addressHandler(item)}</div>
              <div className='w-1/5 text-center'>{walletsArrInfo[index] && walletsArrInfo[index].solBalance || '0'}</div>
              <div className='w-1/5 text-center'>{walletsArrInfo[index] && walletsArrInfo[index].baseTokenBlance || '0'}</div>
              {signatureArr[index] ?
                (signatureArr[index] === 'over' || signatureArr[index] === 'error') ?
                  <div className='w-1/5 text-center' style={{ color: `${signatureArr[index] === 'over' ? "#ffcb00" : "#e31919"}` }}>
                    {signatureArr[index] === 'over' ? '跳过执行' : '执行失败'}
                  </div> :
                  <div className='w-1/5 text-center cursor-pointer underline' style={{ color: '#63e2bd' }}>
                    <a target='_blank' href={getTxLink(signatureArr[index])}>执行完成</a>
                  </div> :
                <div className='w-1/5 text-center' style={{ color: '#9ca3c1' }}>
                  等待执行
                </div>
              }
              <div className='w-1/5 text-center flex justify-center cursor-pointer'>
                <div className='one_btn' onClick={() => startCollector(index, true)}>执行</div>
                <DeleteOutlined onClick={() => deleteClick(index)} />
              </div>
            </div>
          ))}
        </div>

        <div className=''>
          <div className='font-bold mb-2'>{t('Select collection method')}</div>
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

        <div className='flex buttonSwapper mt-5'>
          <Button className={Button_Style} onClick={collectorClick} loading={isSending}>{t('Start Collect')}</Button>
          <Button className={Button_Style} onClick={cleanLog}>{t('clear log')}</Button>
        </div>

        <div className="logswapper mt-5">
          {[...logsArr].reverse().map((item: Test, index) => (
            <div key={index} className='flex'>
              <div className='logs_time'>
                <span >{item.time}</span>
                {
                  item.isHash ?
                    <a href={getTxLink(item.isHash)} target='_blank' style={{ color: item.color }}>
                      <span className='ml-1'>{item.data}</span>
                    </a>
                    : <span className='ml-1' style={{ color: item.color }}>{item.data}</span>
                }
              </div>
            </div>
          ))}
        </div >
      </CollectorPage>
    </Page>
  )
}

export default Authority