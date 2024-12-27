import React, { useState, useEffect } from 'react';
import { Button, Modal, message, Flex, Spin } from 'antd';
import { useTranslation } from "react-i18next";
import { BsPlus, BsCopy } from "react-icons/bs";
import copy from 'copy-to-clipboard';
import { LoadingOutlined } from '@ant-design/icons'
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
} from "@solana/web3.js";
import { Input_Style } from '@/config'
import { getImage, IsAddress, addressHandler, fetcher } from '@/utils'
import { getAsset } from '@/utils/sol'
import { getSPLBalance } from '@/utils/util'
import { getAllToken } from '@/utils/newSol'
import { SOL, USDC, USDT } from './Token'
import type { Token_Type } from '@/type'
import { TOKEN_BOX, SelectTokenPage, AllTokenItem } from './style'

interface PropsType {

  callBack: (token: Token_Type) => void
}

const App = (props: PropsType) => {
  const { callBack } = props
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tokenAddress, setTokenAddress] = useState('')
  const [isSearch, setIsSearch] = useState(false)

  const [token, setToken] = useState<Token_Type>(null) //展示的代币
  const [newToken, setNewToken] = useState<Token_Type>() //单个代币
  const [allTokenArr, setAllTokenArr] = useState<Token_Type[]>([])
  const [notFound, setNotFound] = useState(false)


  useEffect(() => {
    if (IsAddress(tokenAddress)) {
      getQuoteInfo()
    } else {
      setNewToken(null)
      setNotFound(false)
    }
  }, [tokenAddress])

  const tokenAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenAddress(e.target.value)
    setNewToken(null)
  }
  const showModal = () => {
    setIsModalOpen(true)
    if (publicKey) {
      getAccountAllToken()
    }
  }
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
          balance: item.balance
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

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  //获取输入代币信息
  const getQuoteInfo = async () => {
    try {
      setIsSearch(true)
      setNotFound(false)

      const { name, symbol, image, decimals } = await getAsset(connection, tokenAddress)
      let balance = 0
      if (publicKey) {
        balance = await getSPLBalance(connection, new PublicKey(tokenAddress), publicKey)
      }
      setNewToken({
        address: tokenAddress,
        name, symbol, image, decimals,
        balance: balance.toString()
      })

      setIsSearch(false)
    } catch (error) {
      console.log(error, 'getTokenInfo')
      setIsSearch(false)
      setNotFound(true)
    }
  }

  const maintokenItemClick = async (_token: Token_Type) => {
    setToken(_token)
    setIsModalOpen(false)
    callBack(_token)
  }

  const tokenItemClick = async (_token: Token_Type) => {
    setToken(_token)
    setIsModalOpen(false)
    callBack(_token)
  }

  const copyClick = (item: string) => {
    copy(item)
    messageApi.success('copy success')
  }

  return (
    <SelectTokenPage>
      {contextHolder}
      {token ?
        <div className='flex-1 flex items-center justify-between' onClick={showModal}>
          <div className='flex items-center'>
            <div>
              <img src={token.image} width={40} height={40} />
            </div>
            <div className='ml-3 flex items-center'>
              <div>{token.symbol}</div>
              <div className='ml-3 address mr-2'>{addressHandler(token.address)}</div>
            </div>
          </div>
          <div>{token.balance}</div>
        </div> :
        <div className='addtoken' onClick={showModal}>
          <BsPlus />
          <div>点击选择代币</div>
        </div>
      }

      <Modal open={isModalOpen} footer={null} onCancel={handleCancel} width={600}>
        <div>
          <p className='font-bold mt-5 text-lg mb-2'>{t('Choose Token')}</p>
          <input className={Input_Style} placeholder='请选择或输入代币地址'
            value={tokenAddress} onChange={tokenAddressChange} />
          {(tokenAddress && !IsAddress(tokenAddress)) && <div className='text-red-400'>{t('This is not the sol token address')}</div>}
          {notFound && <div className='font-bold mt-5 text-center text-lg'>{t('Token not found')}</div>}
        </div>


        <div className='flex mb-3'>
          <TOKEN_BOX onClick={() => maintokenItemClick(SOL)}>
            <img src={getImage('sol.png')} width={26} height={26} />
            <div className='ml-1'>SOL</div>
          </TOKEN_BOX>
          <TOKEN_BOX onClick={() => maintokenItemClick(USDC)}>
            <img src={getImage('usdc.png')} width={26} height={26} />
            <div className='ml-1'>USDC</div>
          </TOKEN_BOX>
          <TOKEN_BOX onClick={() => maintokenItemClick(USDT)}>
            <img src={getImage('usdt.svg')} width={26} height={26} />
            <div className='ml-1'>USDT</div>
          </TOKEN_BOX>
        </div>

        {
          isSearch &&
          <Flex align="center" gap="middle" className='mt-4 mb-4 ml-4'>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          </Flex>
        }

        {newToken &&
          <>
            <TOKEN_BOX onClick={() => tokenItemClick(newToken)}>
              <img src={newToken.image} width={26} height={26} />
              <div className='ml-1'>{newToken.symbol}</div>
              <div className='ml-1'>{newToken.address}</div>
            </TOKEN_BOX>
          </>
        }
        {allTokenArr.map((item, index) => (
          <AllTokenItem onClick={() => tokenItemClick(item)} key={index}>
            <div className='allleft'>
              <img src={item.image} width={26} height={26} />
              <div className='ml-2'>
                <div className='ml-1'>{item.symbol}</div>
                <div className='ml-1 tokename'>{item.name}</div>
              </div>
              <div className='ml-3 mr-2'>{addressHandler(item.address)}</div>
              <BsCopy onClick={() => copyClick(item.address)} />
            </div>
            <div className='ml-1'>{item.balance}</div>
            
          </AllTokenItem>
        ))
        }
      </Modal >
    </SelectTokenPage>
  );
};

export default App;