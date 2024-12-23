import { useEffect, useState } from 'react'
import { Button, Modal, Input, Flex, Spin } from 'antd';
import { useTranslation } from "react-i18next";
import { BsPlus } from "react-icons/bs";
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { LoadingOutlined } from '@ant-design/icons'
import { getTxLink, addPriorityFees } from '@/utils'
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getImage, addressHandler } from '@/utils';
import { createCloseAccountInstruction, createBurnCheckedInstruction } from '@solana/spl-token';
import { Header } from '@/components';
import { getAllToken } from '@/utils/newSol'
import { Page } from '@/styles';
import type { Token_Type } from '@/type'
import { CLOSE_ACCOUNT_CU, ADD_COMPUTE_UNIT_PRICE_CU, ADD_COMPUTE_UNIT_LIMIT_CU } from "./CUPerInstruction";
import { confirmTransaction } from './confirmTransaction'
import {
  Card,
  CardSwapper
} from './style'

function CloseAccount() {
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [allTokenArr, setAllTokenArr] = useState<Token_Type[]>([])
  const [isSearch, setIsSearch] = useState(false)

  useEffect(() => {
    if (publicKey && publicKey.toBase58()) getAccountAllToken()
  }, [publicKey])
  //获取账户全部代币
  const getAccountAllToken = async () => {
    try {
      setIsSearch(true)
      const data = await getAllToken(publicKey.toBase58())

      const tokenArr: Token_Type[] = []
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
        tokenArr.push(token)
      })
      console.log(tokenArr)

      // const splAccounts = await connection.getParsedTokenAccountsByOwner(
      //   publicKey,
      //   {
      //     programId: new PublicKey(
      //       "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
      //     ),
      //   },
      //   "processed"
      // );
      // console.log(splAccounts, 'splAccounts')
      // splAccounts.value.forEach((m) => {
      //   const associatedAccount = m.pubkey.toBase58();
      //   const token = m.account?.data?.parsed?.info?.mint;
      //   tokenArr.forEach((item, index) => {
      //     if (item.address === token) {
      //       tokenArr[index].associaAccount = associatedAccount
      //     }
      //   })
      // });
      // console.log(tokenArr, 'tokenArr1111111')

      setAllTokenArr(tokenArr)
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


  const closeAccount = async () => {
    try {
      // const assets = allTokenArr.filter(item => item.isSelect)
      const assets = allTokenArr

      console.log(assets, '_closeAccounts')

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
      console.log(signedTransactions, 'signedTransactions')
      for (let n = 0; n < signedTransactions.length; n++) {
        const signature = await connection.sendRawTransaction(signedTransactions[n].serialize(), {
          skipPreflight: true
        });
        console.log(signature, 'signature')
        await confirmTransaction(connection, signature);
      }

      // let Tx = new Transaction();
      // for (let index = 0; index < 10; index++) {
      //   const account = allTokenArr[index]
      //   if (Number(account.balance) > 0) {
      //     const burn = createBurnCheckedInstruction(
      //       new PublicKey(account.associatedAccount),
      //       new PublicKey(account.address),
      //       publicKey,
      //       Number(account.balance) * (10 ** Number(account.decimals)),
      //       account.decimals
      //     )
      //     Tx.add(burn)
      //   }
      //   const close = createCloseAccountInstruction(
      //     new PublicKey(account.associatedAccount),
      //     publicKey,
      //     publicKey
      //   )
      //   Tx.add(close)
      // }

      // let Tx1 = new Transaction();
      // for (let index = 10; index < 20; index++) {
      //   const account = allTokenArr[index]
      //   if (Number(account.balance) > 0) {
      //     const burn = createBurnCheckedInstruction(
      //       new PublicKey(account.associatedAccount),
      //       new PublicKey(account.address),
      //       publicKey,
      //       Number(account.balance) * (10 ** Number(account.decimals)),
      //       account.decimals
      //     )
      //     Tx1.add(burn)
      //   }
      //   const close = createCloseAccountInstruction(
      //     new PublicKey(account.associatedAccount),
      //     publicKey,
      //     publicKey
      //   )
      //   Tx1.add(close)
      // }

      // const versionedTx = await addPriorityFees(connection, Tx, publicKey)
      // const versionedTx1 = await addPriorityFees(connection, Tx1, publicKey)

      // const signature = await signAllTransactions([versionedTx, versionedTx1]);
      // console.log(signature)

    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Page>
      <Header title='关闭账户-回收Solana'
        hint='关闭Solana的闲置的Token账户，回收账户租金（每个账户可收取约0.00203 SOL）。' />
      {
        isSearch &&
        <Flex align="center" gap="middle" className='mt-4 mb-4 ml-4'>
          <Spin indicator={<LoadingOutlined spin />} size="large" />
        </Flex>
      }

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

      <Button onClick={closeAccount}>cse</Button>

    </Page>
  )
}

export default CloseAccount