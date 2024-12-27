import { useEffect, useState } from 'react'
import { Button, notification, Input, Flex, Spin } from 'antd';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { LoadingOutlined } from '@ant-design/icons'
import { getTxLink, addPriorityFees } from '@/utils'
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getImage, addressHandler } from '@/utils';
import { createCloseAccountInstruction, createBurnCheckedInstruction } from '@solana/spl-token';
import { Header, Hint1, Result } from '@/components';
import { getAllToken } from '@/utils/newSol'
import { Page } from '@/styles';
import type { Token_Type } from '@/type'
import { Button_Style } from '@/config'
import {
  CardBox,
  Card,
  CardSwapper
} from './style'

function CloseAccount() {
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [api, contextHolder1] = notification.useNotification();
  const [allTokenArr, setAllTokenArr] = useState<Token_Type[]>([]) //有余额
  const [allTokenArr0, setAllTokenArr0] = useState<Token_Type[]>([]) //余额未0

  const [isSearch, setIsSearch] = useState(false)
  const [isClose, setIsClose] = useState(false)
  const [closeNum, setCloseNum] = useState(0)
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');

  useEffect(() => {
    if (publicKey && publicKey.toBase58()) getAccountAllToken()
  }, [publicKey])
  useEffect(() => {
    getCloseNum()
  }, [allTokenArr, allTokenArr0])
  const getCloseNum = () => {
    const assets1 = allTokenArr.filter(item => item.isSelect)
    const assets0 = allTokenArr0.filter(item => item.isSelect)
    setCloseNum(assets1.length + assets0.length)
  }
  //获取账户全部代币
  const getAccountAllToken = async () => {
    try {
      setIsSearch(true)
      const data = await getAllToken(publicKey.toBase58())

      const tokenArr: Token_Type[] = []
      const tokenArr0: Token_Type[] = []
      data.forEach((item) => {
        const token = {
          address: item.address,
          name: item.info.name,
          symbol: item.info.symbol,
          decimals: item.info.decimals,
          image: item.info.image,
          balance: item.balance,
          isSelect: false,
          associatedAccount: item.associated_account
        }
        Number(item.balance) > 0 ? tokenArr.push(token) : tokenArr0.push(token)
      })
      setAllTokenArr(tokenArr)
      setAllTokenArr0(tokenArr0)

      setIsSearch(false)
    } catch (error) {
      console.log(error)
      setIsSearch(false)
    }
  }

  const cardClick = (index: number) => {
    const obj = [...allTokenArr]
    obj[index].isSelect = !allTokenArr[index].isSelect
    setAllTokenArr(obj)
  }

  const selecAll = (value: boolean) => {
    const obj = [...allTokenArr]
    obj.map(item => item.isSelect = value)
    setAllTokenArr(obj)
  }
  const selecAll0 = (value: boolean) => {
    const obj = [...allTokenArr0]
    obj.map(item => item.isSelect = value)
    setAllTokenArr0(obj)
  }


  const closeAccount = async () => {
    try {

      const assets1 = allTokenArr.filter(item => item.isSelect)
      const assets0 = allTokenArr0.filter(item => item.isSelect)

      const assets = assets1.concat(assets0)
      if (assets.length == 0) return api.info({ message: '请选择需要回收的账户' })
      setIsClose(true)
      // const assets = allTokenArr
      const transactions: VersionedTransaction[] = [];

      const nbPerTx = 10;
      let nbTx: number;
      if (assets.length % nbPerTx == 0) {
        nbTx = assets.length / nbPerTx;
      } else {
        nbTx = Math.floor(assets.length / nbPerTx) + 1;
      }
      //需要签名几次
      for (let i = 0; i < nbTx; i++) {
        let bornSup: number;
        if (i == nbTx - 1) {
          bornSup = assets.length;
        } else {
          bornSup = nbPerTx * (i + 1);
        }
        let Tx = new Transaction()
        let n = 0;
        for (let j = nbPerTx * i; j < bornSup; j++) {
          n += 1;
          if (Number(assets[j].balance) > 0) {
            Tx.add(
              createBurnCheckedInstruction(
                new PublicKey(assets[j].associatedAccount),
                new PublicKey(assets[j].address),
                publicKey,
                Number(assets[j].balance) * (10 ** Number(assets[j].decimals)),
                assets[j].decimals,
              )
            )
          }
          Tx.add(createCloseAccountInstruction(
            new PublicKey(assets[j].associatedAccount),
            publicKey,
            publicKey
          ))
        }

        const versionedTx = await addPriorityFees(connection, Tx, publicKey)
        transactions.push(versionedTx);
      }

      const signedTransactions = await signAllTransactions(transactions);

      for (let n = 0; n < signedTransactions.length; n++) {
        const signature = await connection.sendRawTransaction(signedTransactions[n].serialize(), {
          skipPreflight: true
        });
        console.log(signature, 'signature')
        // await confirmTransaction(connection, signature);
        const confirmed = await connection.confirmTransaction(
          signature,
          "processed"
        );
        console.log(confirmed, 'confirmed')
        setSignature(signature);
      }
      getAccountAllToken()
      setIsClose(false)
      api.success({ message: 'Success' })
    } catch (error) {
      console.log(error)
      setIsClose(false)
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
      {contextHolder1}
      <Header title='关闭账户-回收Solana'
        hint='关闭Solana的闲置的Token账户，回收账户租金（每个账户可收取约0.00203 SOL）。' />
      {
        isSearch &&
        <Flex align="center" gap="middle" className='mt-4 mb-4 ml-4'>
         <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        </Flex>
      }

      <CardBox className='mb-5'>
        <div className='mb-5 flex items-center'>
          <div className='font-semibold'>闲置账户</div>
          <Button className='ml-4' onClick={() => selecAll0(true)}>全选</Button>
          <Button className='ml-2' onClick={() => selecAll0(false)}>全不选</Button>
        </div>
        <CardSwapper>
          {allTokenArr0.map((item, index) => (
            <Card className={item.isSelect ? 'cardActive' : ''} key={index} onClick={() => cardClick(index)}>
              <div className='header'>
                <img src={item.image ? item.image : getImage('banana.png')} />
                {item.isSelect &&
                  <div className='active'>已选择</div>
                }
              </div>

              <div className='footer'>
                <div className='name'>{item.name}</div>
                <div className='name'>{item.balance} {item.symbol}</div>
                <div className='address'>{addressHandler(item.address)}</div>
              </div>
            </Card>
          ))}
        </CardSwapper>
      </CardBox>

      <CardBox className='mb-5'>
        <div className='mb-5 flex items-center'>
          <div className='font-semibold'>有余额的账户</div>
          <Button className='ml-4' onClick={() => selecAll(true)}>全选</Button>
          <Button className='ml-2' onClick={() => selecAll(false)}>全不选</Button>
        </div>
        <CardSwapper>
          {allTokenArr.map((item, index) => (
            <Card className={item.isSelect ? 'cardActive' : ''} key={index} onClick={() => cardClick(index)}>
              <div className='header'>
                <img src={item.image ? item.image : getImage('banana.png')} />
                {item.isSelect &&
                  <div className='active'>已选择</div>
                }
              </div>

              <div className='footer'>
                <div className='name'>{item.name}</div>
                <div className='name'>{item.balance} {item.symbol}</div>
                <div className='address'>{addressHandler(item.address)}</div>
              </div>
            </Card>
          ))}
        </CardSwapper>
      </CardBox>

      <Hint1 title={`共回收：${closeNum}个账户，合约可回收≈ ${closeNum * 0.002039} SOL`} />

      <div className='btn mt-6'>
        <div className='buttonSwapper'>
          <Button className={Button_Style}
            onClick={closeAccount} loading={isClose}>
            <span>批量回收账户</span>
          </Button>
        </div>
        <div className='fee'>全网最低服务费: 0 SOL</div>
      </div>

      <Result signature={signature} error={error} />

    </Page>
  )
}

export default CloseAccount