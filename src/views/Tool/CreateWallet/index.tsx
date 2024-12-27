import { useState, useEffect } from 'react'
import { Button, message } from 'antd'
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as XLSX from 'xlsx';
import copy from 'copy-to-clipboard';
import { useTranslation } from "react-i18next";
import { Page } from '@/styles';

import { Input_Style, Button_Style } from '@/config'
import { Header } from '@/components'
import {
  CreateWalletPage
} from './style'

interface Wallet_Type {
  address: string
  privateKey: string
}

function CreateWallet() {
  const [messageApi, contextHolder] = message.useMessage()
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [walletsArr, setWalletsArr] = useState<Wallet_Type[]>([])
  const amountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
  }

  const CreateWallet = () => {
    const _WalletsArr = []
    for (let i = 0; i < Number(amount); i++) {
      const wallet = Keypair.generate()
      const address = wallet.publicKey.toString()
      const privateKey = bs58.encode(wallet.secretKey)
      _WalletsArr.push({ address, privateKey })
    }
    setWalletsArr(_WalletsArr)
  }

  const downCSV = () => {
    // 创建一个新的工作簿
    const workbook = XLSX.utils.book_new();

    // 将数据转换为工作表
    const worksheetData = [
      ['address', 'privateKey'], // 标题
      ...walletsArr.map(wallet => [wallet.address, wallet.privateKey])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const time = new Date().getTime()
    // 将工作表添加到工作簿中
    XLSX.utils.book_append_sheet(workbook, worksheet);
    // 导出 Excel 文件
    XLSX.writeFile(workbook, `钱包数据${time}.csv`);
  }

  const copyClick = (text: string) => {
    copy(text)
    messageApi.success('copy success')
  }

  return (
    <Page >
      {contextHolder}
      <Header title={t('Create wallets in batches')} />
      <CreateWalletPage>
        <div className='flex items-center'>
          <div className='titlea'>{t('Enter quantity')}：</div>
          <input
            type="text"
            className={Input_Style}
            placeholder={t('Please enter quantity')}
            value={amount}
            onChange={amountChange}
          />
        </div>

        <div className='text-center mt-3 buttonSwapper'>
          <Button className={Button_Style} onClick={CreateWallet}>{t('Generate wallet')}</Button>
          <Button className={Button_Style} onClick={downCSV}>{t('Export CSV')}</Button>
        </div>

        <div className='wallets wallet_bt mt-3'>
          <div className='wallets_left'>{t('wallet')}</div>
          <div className='wallets_right'>{t('privateKey')}</div>
        </div>

        <div className='wallets_box'>
          {walletsArr.map((item, index) => (
            <div className='wallets wallet_bb' key={index}>
              <div className='wallets_left' onClick={() => copyClick(item.address)}>{item.address}</div>
              <div className='wallets_right' onClick={() => copyClick(item.privateKey)}>{item.privateKey}</div>
            </div>
          ))}
        </div>
      </CreateWalletPage>
    </Page>
  )
}

export default CreateWallet