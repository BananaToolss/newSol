import { useState, SetStateAction, Dispatch } from 'react'
import { Button, message, notification, Input, Checkbox, Spin } from 'antd'
import type { CheckboxChangeEvent } from 'antd'
import {
  Keypair,
  PublicKey,
  Connection,
  LAMPORTS_PER_SOL,

} from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { BsCopy } from "react-icons/bs";
import { LoadingOutlined } from '@ant-design/icons';
import { DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons'
import {
  getMint,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AccountLayout
} from "@solana/spl-token";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { addressHandler } from '@/utils'
import { getMultipleAccounts } from '@/utils/sol'
import { LoadingOut } from '@/components'
import { Button_Style1 } from '@/config'
import { SOL_TOKEN } from '../SelectToken/Token';
import type { CollocetionType } from '@/type'
import PrivateKeyPage from './PrivateKeyPage'
import {
  WalletInfoPage
} from './style'


interface PropsType {
  tokenAddr: string | null
  config: CollocetionType[]
  setConfig: Dispatch<SetStateAction<CollocetionType[]>>
}
1
function WalletInfo(props: PropsType) {
  const { tokenAddr, config, setConfig } = props

  const [api, contextHolder1] = notification.useNotification();
  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();

  const [privateKeys, setPrivateKeys] = useState([]) //私钥数组
  const [isLoading, setIsLoading] = useState(false)
  const [totalSol, setTotalSol] = useState('')
  const [totalToken, stTotalToken] = useState('')


  //**钱包私钥数组 */
  const privateKeyCallBack = async (keys: string) => {
    const resultArr = keys.split(/[(\r\n)\r\n]+/)
    const _privateKeys = resultArr.filter((item: string) => item !== '')
    setPrivateKeys(_privateKeys)
    getWalletsInfo(_privateKeys)
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

  const getWalletsInfo = async (keys?: string[]) => {
    try {
      const _privateKeys = keys ? keys : privateKeys
      if (_privateKeys.length === 0) return setConfig([])
      setIsLoading(true)

      const accountsArr: PublicKey[] = [] //钱包地址
      _privateKeys.forEach(async (item, index) => {
        try {
          const wallet = Keypair.fromSecretKey(bs58.decode(item))
          const address = wallet.publicKey
          accountsArr.push(address)
        } catch (error) {
          api.error({ message: `第${index + 1}个私钥格式错误，跳过该钱包` })
        }
      })

      let decimals = 9 //代币信息
      let associaArr = []; //目标代币数组
      if (tokenAddr && tokenAddr !== SOL_TOKEN) {
        const mintInfo = await getMint(connection, new PublicKey(tokenAddr));
        decimals = mintInfo.decimals
        for (const account of accountsArr) {
          const to = await getAt(new PublicKey(tokenAddr), account);
          associaArr.push(to)
        }
      }

      let accountsArrSlice = []
      let associaArrSlice = []
      for (let i = 0; i < accountsArr.length; i += 100) {
        accountsArrSlice.push(accountsArr.slice(i, i + 100))
        associaArrSlice.push(associaArr.slice(i, i + 100))
      }
      let accountsSOL: any[] = []
      let associaBalace: any[] = []

      for (let i = 0; i < accountsArrSlice.length; i++) {
        const _accountSol = await connection.getMultipleAccountsInfo(accountsArrSlice[i], "processed")
        accountsSOL = [...accountsSOL, ..._accountSol]
        if (associaArrSlice[i]) {
          const _associaBalace = await connection.getMultipleAccountsInfo(associaArrSlice[i], "processed")
          associaBalace = [...associaBalace, ..._associaBalace]
        }
      }

      let accountInfoList: CollocetionType[] = []
      let _totalSol = 0
      let _tokenToken = 0

      for (let i = 0; i < accountsSOL.length; i++) {
        let solBalance = 0
        if (accountsSOL[i] != undefined) {
          solBalance = accountsSOL[i].lamports / 10 ** 9
        }
        let tokenBalance = 0
        if (tokenAddr === SOL_TOKEN) {
          tokenBalance = solBalance
        } else if (associaBalace[i] != undefined) {
          const accountData = AccountLayout.decode(associaBalace[i].data);
          tokenBalance = Number(accountData.amount) / 10 ** decimals
        }
        accountInfoList.push(
          {
            isCheck: false,
            privateKey: _privateKeys[i],
            walletAddr: accountsArr[i].toBase58(),
            balance: solBalance ? solBalance : 0,
            tokenBalance: tokenBalance ? tokenBalance : 0,
            assiciaAccount: associaArr[i] ? associaArr[i] : ''
          }
        )
        _totalSol += solBalance ? solBalance : 0
        _tokenToken += tokenBalance ? tokenBalance : 0
      }
      console.log(accountInfoList, 'accountInfoList')
      setConfig(accountInfoList)
      setTotalSol(_totalSol.toString())
      stTotalToken(_tokenToken.toString())

      setIsLoading(false)
    } catch (error) {
      console.log(error, 'error')
      api.error({ message: error.toString() })
      setIsLoading(false)
    }
  }


  const deleteClick = (account: string, index: number) => {
    const _config = config.filter(item => item.walletAddr !== account)
    setConfig(_config)

    const _privateKeys = [...privateKeys]
    _privateKeys.splice(index, 1)
    setPrivateKeys(_privateKeys)
  }

  const [checkAll, setCheckAll] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const onCheckAllChange = (e: CheckboxChangeEvent) => {
    setIndeterminate(false);
    setCheckAll(e.target.checked);

    const _config = [...config]
    _config.map(item => item.isCheck = e.target.checked)
    setConfig(_config)
  };
  const itemOnCheckChange = (e: CheckboxChangeEvent) => {
    const _config = [...config]
    _config[Number(e.target.name)].isCheck = e.target.checked
    const checkArr = _config.filter(item => item.isCheck)
    setConfig(_config)
    if (checkArr.length === 0) {
      setIndeterminate(false);
      setCheckAll(false)
    } else if (checkArr.length === _config.length) {
      setIndeterminate(false);
      setCheckAll(true)
    } else {
      setIndeterminate(true);
    }
  }

  return (
    <WalletInfoPage>
      {contextHolder}
      {contextHolder1}
      <div className='header'>钱包信息</div>

      <div className='flex items-center btns'>
        <div className='buttonSwapper'>
          <PrivateKeyPage privateKeys={privateKeys} callBack={privateKeyCallBack} title='导入钱包' />
          <Button className={`${Button_Style1} ml-2`} onClick={() => getWalletsInfo()}>获取余额</Button>
        </div>
        <div className='flex items-center h-100 flex-wrap'>
          <Button>选择余额为0</Button>
          <Button className='ml-2'>选择余额大于0</Button>
          <Button className='ml-2'>反选</Button>
          <Button className='ml-2'>选择失败</Button>
          <Button className='ml-2'><DeleteOutlined /></Button>
        </div>
      </div>

      <div className='wallet'>
        <div className='walletHeader'>
          <div><Checkbox indeterminate={indeterminate} checked={checkAll} onChange={onCheckAllChange} /></div>
          <div>地址</div>
          <div>SOL余额</div>
          <div>所选代币余额</div>
          <div>状态</div>
          <div>移除数量</div>
        </div>
        {isLoading && <LoadingOut title='钱包信息加载中...' />}
        {!isLoading &&
          <div className='waletSwapper'>
            {config.map((item, index) => (
              <div className='walletInfo' key={item.walletAddr}>
                <div>
                  <span>
                    <Checkbox className='mr-2' checked={item.isCheck} onChange={itemOnCheckChange} name={`${index}`} />
                    {index + 1}
                  </span>
                </div>
                <div className='flex items-center'>
                  <span>{addressHandler(item.walletAddr)} </span>
                  <BsCopy className='ml-2' />
                </div>
                <div>{item.balance}</div>
                <div>{item.tokenBalance}</div>
                <div><Button>未执行</Button></div>
                <div><DeleteOutlined onClick={() => deleteClick(item.walletAddr, index)} /></div>
              </div>
            ))}
          </div>
        }

        <div className='mt-5'>
          <div>
            <div className='font-bold'>地址数量：{config.length}</div>
            <div className='font-bold'>SOL余额：{totalSol}</div>
            <div className='font-bold'>所选代币余额：{totalToken}</div>
          </div>
        </div>
      </div>
    </WalletInfoPage>
  )
}

export default WalletInfo