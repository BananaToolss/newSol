import { useState, useEffect } from 'react'
import { Button, message, notification, Input, Flex, Spin } from 'antd'
import {
  Keypair,
  PublicKey,
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { LoadingOutlined } from '@ant-design/icons';
import { DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { addressHandler } from '@/utils'
import { getMultipleAccounts } from '@/utils/sol'
import { LoadingOut } from '@/components'
import PrivateKeyPage from './PrivateKeyPage'
import {
  WalletInfoPage
} from './style'


interface ConfigType {
  walletAddr: string,
  balance: string,
  buySol: string,
}

function WalletInfo() {
  const [api, contextHolder1] = notification.useNotification();
  const [messageApi, contextHolder] = message.useMessage();
  const [privateKeys, setPrivateKeys] = useState([]) //私钥数组


  const [config, setConfig] = useState<ConfigType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fixedAmount, setFixedAmount] = useState('')

  useEffect(() => {
    getWalletsInfo()
  }, [privateKeys])
  //**钱包私钥数组 */
  const privateKeyCallBack = async (keys: string) => {
    const resultArr = keys.split(/[(\r\n)\r\n]+/)
    const _privateKeys = resultArr.filter((item: string) => item !== '')
    setPrivateKeys(_privateKeys)
  }

  const getWalletsInfo = async () => {
    try {
      if (privateKeys.length === 0) return setConfig([])
      setIsLoading(true)
      const _addressArr = []
      privateKeys.forEach(async (item, index) => {
        try {
          const wallet = Keypair.fromSecretKey(bs58.decode(item))
          const address = wallet.publicKey.toBase58()
          _addressArr.push(address)
        } catch (error) {
          api.error({ message: `第${index + 1}个私钥格式错误，跳过该钱包` })
        }
      })

      const balances = await getMultipleAccounts(_addressArr)
      const _config = []
      _addressArr.forEach((item, index) => {
        const wallet = {
          walletAddr: item,
          balance: balances[index].toString(),
          buySol: '',
        }
        _config.push(wallet)
      })
      setConfig(_config)
      setIsLoading(false)
    } catch (error) {
      api.error({ message: error.toString() })
      setIsLoading(false)
    }
  }

  const buySolChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const _config = [...config]
    _config[index].buySol = e.target.value
    setConfig(_config)
  }
  const deleteClick = (account: string) => {
    const _config = config.filter(item => item.walletAddr !== account)
    setConfig(_config)
  }
  const fixedAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFixedAmount(e.target.value)
  }

  const autoClick = () => {
    const amount = fixedAmount
    const _config = config.map(item => {
      item.buySol = amount
      return item
    })
    setConfig(_config)
  }

  return (
    <WalletInfoPage>
      {contextHolder}
      {contextHolder1}
      {/* <div className='header'>钱包信息</div> */}
      <div>
        <PrivateKeyPage privateKeys={privateKeys} callBack={privateKeyCallBack} title='导入钱包' />
        <Button className='ml-3' onClick={getWalletsInfo}>获取余额</Button>
      </div>

      <div className='autoInput'>
        <div className='mr-2'>
          <Input placeholder='买入SOL数量' value={fixedAmount} onChange={fixedAmountChange} />
        </div>
        <Button onClick={autoClick}>一键填写</Button>
      </div>

      <div className='wallet'>
        <div className='walletHeader'>
          <div>地址</div>
          <div>SOL余额</div>
          <div>购买数量(SOL)</div>
          <div>移除数量</div>
        </div>
        {isLoading && <LoadingOut title='钱包信息加载中...' />}
        {!isLoading &&
          <>
            {config.map((item, index) => (
              <div className='walletInfo' key={item.walletAddr}>
                <div>钱包{index + 1}：{addressHandler(item.walletAddr)}</div>
                <div>{item.balance}</div>
                <div>
                  <Input value={item.buySol} onChange={(e) => buySolChange(e, index)} placeholder='请输入购买sol数量' />
                </div>
                <div><DeleteOutlined onClick={() => deleteClick(item.walletAddr)} /></div>
              </div>
            ))}
          </>
        }
      </div>
    </WalletInfoPage>
  )
}

export default WalletInfo