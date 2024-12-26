import { useState } from 'react'
import { Button } from 'antd'
import PrivateKeyPage from './PrivateKeyPage'
import {
  WalletInfoPage
} from './style'

function WalletInfo() {

  const [privateKeys, setPrivateKeys] = useState([]) //私钥数组
  //**钱包私钥数组 */
  const privateKeyCallBack = (keys: string) => {
    const resultArr = keys.split(/[(\r\n)\r\n]+/)
    const _privateKeys = resultArr.filter((item: string) => item !== '')
    setPrivateKeys(_privateKeys)
  }
  const arr = [1, 23]

  return (
    <WalletInfoPage>
      <div className='header'>钱包信息</div>
      <div>
        <PrivateKeyPage privateKeys={privateKeys} callBack={privateKeyCallBack} title='导入钱包' />
        <Button className='ml-3'>获取余额</Button>
        <Button className='ml-3'>添加新钱包</Button>
      </div>

      <div className='wallet'>
        <div className='walletHeader'>
          <div>地址</div>
          <div>SOL余额</div>
          <div>购买数量(SOL)</div>
          <div>移除数量</div>
        </div>
        {arr.map((item, index) => (
          <div className='walletInfo'>
            <div>地址</div>
            <div>SOL余额</div>
            <div>购买数量(SOL)</div>
            <div>移除数量</div>
          </div>
        ))}
      </div>
    </WalletInfoPage>
  )
}

export default WalletInfo