import { useEffect, useState } from 'react'
import { Button, Modal, Input, Flex, Spin } from 'antd';
import { useTranslation } from "react-i18next";
import { BsPlus } from "react-icons/bs";
import { LoadingOutlined } from '@ant-design/icons'
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getImage, addressHandler } from '@/utils';
import { getTokenAccountsByOwner } from '@/utils/sol'
import { getAllToken } from '@/utils/newSol'
import { Page } from '@/styles';
import type { Token_Type } from '@/type'
import {
  Card,
  CardSwapper
} from './style'

function CloseAccount() {
  const { publicKey, sendTransaction } = useWallet();

  const [allTokenArr, setAllTokenArr] = useState<Token_Type[]>([])
  const [isSearch, setIsSearch] = useState(false)

  useEffect(() => {
    if (publicKey) getAccountAllToken()
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
          isSelect: false
        }
        tokenArr.push(token)
      })
      console.log(tokenArr)
      setAllTokenArr(tokenArr)
      setIsSearch(false)
    } catch (error) {
      console.log(error)
      setIsSearch(false)
    }
  }

  return (
    <Page>
      {
        isSearch &&
        <Flex align="center" gap="middle" className='mt-4 mb-4 ml-4'>
          <Spin indicator={<LoadingOutlined spin />} size="large" />
        </Flex>
      }

      <CardSwapper>
        {allTokenArr.map((item, index) => (
          <Card className={item.isSelect ? 'cardActive' : ''} key={index}>
            <div className='header'>
              <img src={item.image} />
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


    </Page>
  )
}

export default CloseAccount