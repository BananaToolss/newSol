import React, { useState, useEffect } from 'react';
import { Button, Modal, Input } from 'antd';
import { useTranslation } from "react-i18next";
import { BsPlus } from "react-icons/bs";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { Button_Style, Input_Style } from '@/config'
import { getImage, IsAddress, addressHandler, fetcher } from '@/utils'
import { SOL, USDC, USDT } from './Token'
import type { Token_Type } from './Token'
import { TOKEN_BOX, SelectTokenPage } from './style'

interface PropsType {
  isUSDC?: boolean
  isBase?: boolean
  isPump?: boolean
  callBack: (value: string, symbol: string) => void
}

const App = (props: PropsType) => {
  const { isUSDC, isBase, isPump, callBack } = props
  const { connection } = useConnection();
  const { t } = useTranslation()
  const [token, setToken] = useState<Token_Type>(null)
  const [value, setValue] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newToken, setNewToken] = useState<Token_Type>()

  const [isFind, setIsFind] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (isUSDC) setToken(USDC)
  }, [isUSDC])
  useEffect(() => {
    if (IsAddress(value)) {
      getQuoteInfo()
    } else {
      setNewToken(null)
      setNotFound(false)
    }
  }, [value])
  const valueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    setNewToken(null)
  }
  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const getQuoteInfo = async () => {
    try {
      setIsFind(true)
      setNotFound(false)

      setIsFind(false)
    } catch (error) {
      console.log(error, 'getTokenInfo')
      setIsFind(false)
      setNotFound(true)
    }
  }
  const tokenItemClick = async (_token: Token_Type) => {
    setToken(_token)
    setIsModalOpen(false);
    callBack(_token.mint, _token.symbol)
  }

  return (
    <SelectTokenPage>
      {token ?
        <div className='flex-1 flex items-center justify-between' onClick={showModal}>
          <div className='flex items-center'>
            <div>
              <img src={token.uri} width={40} height={40} />
            </div>
            <div className='ml-3 flex items-center'>
              <div>{token.symbol}</div>
              <div className='ml-3 address'>{addressHandler(token.mint)}</div>
            </div>
          </div>
          <div>180.00</div>
        </div> :
        <div className='addtoken' onClick={showModal}>
          <BsPlus />
          <div>点击选择代币</div>
        </div>
      }

      <Modal open={isModalOpen} footer={null} onCancel={handleCancel} width={600}>
        {!isBase &&
          <>
            <p className='font-bold mt-5 text-lg mb-2'>{t('Choose Token')}</p>
            <input className={Input_Style} placeholder='请选择或输入代币地址'
              value={value} onChange={valueChange} />
            {(value && !IsAddress(value)) && <div className='text-red-400'>{t('This is not the sol token address')}</div>}
            {(isFind && !newToken) && <div className='font-bold mt-5 text-center text-lg'>{t('Querying')}...</div>}
            {notFound && <div className='font-bold mt-5 text-center text-lg'>{t('Token not found')}</div>}
          </>
        }


        <div className='flex'>
          <TOKEN_BOX onClick={() => tokenItemClick(SOL)}>
            <img src={getImage('sol.png')} width={26} height={26} />
            <div className='ml-1'>SOL</div>
          </TOKEN_BOX>
          <TOKEN_BOX onClick={() => tokenItemClick(USDC)}>
            <img src={getImage('usdc.png')} width={26} height={26} />
            <div className='ml-1'>USDC</div>
          </TOKEN_BOX>
          <TOKEN_BOX onClick={() => tokenItemClick(USDT)}>
            <img src={getImage('usdt.svg')} width={26} height={26} />
            <div className='ml-1'>USDT</div>
          </TOKEN_BOX>
        </div>

        {newToken &&
          <>
            <TOKEN_BOX onClick={() => tokenItemClick(newToken)}>
              <img src={newToken.uri} width={26} height={26} />
              <div className='ml-1'>{newToken.symbol}</div>
              <div className='ml-1'>{newToken.mint}</div>
            </TOKEN_BOX>
          </>
        }
      </Modal >
    </SelectTokenPage>
  );
};

export default App;