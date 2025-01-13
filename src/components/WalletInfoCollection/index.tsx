import { useState, SetStateAction, Dispatch, useEffect } from 'react'
import { Button, message, notification, Tag, Checkbox, Spin } from 'antd'
import type { CheckboxChangeEvent } from 'antd'
import {
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { BsCopy } from "react-icons/bs";
import { DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons'
import {
  getMint,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AccountLayout
} from "@solana/spl-token";
import copy from 'copy-to-clipboard';
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { addressHandler } from '@/utils'
import { LoadingOut } from '@/components'
import { Button_Style1 } from '@/config'
import { SOL_TOKEN } from '../../config/Token';
import type { CollocetionType } from '@/type'
import PrivateKeyPage from './PrivateKeyPage'
import {
  WalletInfoPage
} from './style'


interface PropsType {
  tokenAddr: string | null
  config: CollocetionType[]
  setConfig: Dispatch<SetStateAction<CollocetionType[]>>
  isBot?: boolean
  baseToken?: string
}

function WalletInfo(props: PropsType) {
  const { tokenAddr, config, setConfig, isBot, baseToken } = props

  const [api, contextHolder1] = notification.useNotification();
  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();

  const [privateKeys, setPrivateKeys] = useState([]) //私钥数组
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    getWalletsInfo()
  }, [tokenAddr, baseToken])
  useEffect(() => {
    privateChange()
  }, [config])

  const privateChange = () => {
    const _privateKeys = []
    config.forEach(item => {
      _privateKeys.push(item.privateKey)
    })
    setPrivateKeys(_privateKeys)
  }

  //**钱包私钥数组 */
  const privateKeyCallBack = async (keys: string) => {
    const resultArr = keys.split(/[(\r\n)\r\n]+/)
    const _privateKeys = resultArr.filter((item: string) => item !== '')
    setPrivateKeys(_privateKeys)
    getWalletsInfo(_privateKeys)
    setCheckAll(false)
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
      if (isLoading) return
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
      let associaArr: PublicKey[] = []; //目标代币数组

      let baseAccouns: PublicKey[] = [] //价值代币
      let baseDecimals = 9

      if (tokenAddr && tokenAddr !== SOL_TOKEN) {
        const mintInfo = await getMint(connection, new PublicKey(tokenAddr));
        decimals = mintInfo.decimals
        for (const account of accountsArr) {
          const to = await getAt(new PublicKey(tokenAddr), account);
          associaArr.push(to)
        }
      }
      if (baseToken && baseToken !== SOL_TOKEN) {
        const mintInfo = await getMint(connection, new PublicKey(baseToken));
        baseDecimals = mintInfo.decimals
        for (const account of accountsArr) {
          const to = await getAt(new PublicKey(baseToken), account);
          baseAccouns.push(to)
        }
      }

      let accountsArrSlice = []
      let associaArrSlice = []
      let baseArrSlice = []
      for (let i = 0; i < accountsArr.length; i += 100) {
        accountsArrSlice.push(accountsArr.slice(i, i + 100))
        associaArrSlice.push(associaArr.slice(i, i + 100))
        baseArrSlice.push(baseAccouns.slice(i, i + 100))
      }
      let accountsSOL: any[] = []
      let associaBalace: any[] = []
      let basetBalace: any[] = []

      for (let i = 0; i < accountsArrSlice.length; i++) {
        const _accountSol = await connection.getMultipleAccountsInfo(accountsArrSlice[i], "processed")
        accountsSOL = [...accountsSOL, ..._accountSol]
        if (associaArrSlice[i]) {
          const _associaBalace = await connection.getMultipleAccountsInfo(associaArrSlice[i], "processed")
          associaBalace = [...associaBalace, ..._associaBalace]
        }
        if (baseArrSlice[i]) {
          const _basetBalace = await connection.getMultipleAccountsInfo(baseArrSlice[i], "processed")
          basetBalace = [...basetBalace, ..._basetBalace]
        }
      }

      let accountInfoList: CollocetionType[] = []

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
        let baseTokenB = 0
        if (baseToken === SOL_TOKEN) {
          baseTokenB = solBalance
        } else if (basetBalace[i] != undefined) {
          const accountData = AccountLayout.decode(basetBalace[i].data);
          baseTokenB = Number(accountData.amount) / 10 ** baseDecimals
        }
        accountInfoList.push(
          {
            isCheck: true,
            privateKey: _privateKeys[i],
            walletAddr: accountsArr[i].toBase58(),
            balance: solBalance ? Number(solBalance.toFixed(4)) : 0,
            tokenBalance: tokenBalance ? Number(tokenBalance.toFixed(4)) : 0,
            assiciaAccount: associaArr[i] ? associaArr[i] : null,
            state: 0,
            baseTBalace: baseTokenB ? Number(baseTokenB.toFixed(4)) : 0,
            baseAssiciaAccount: baseAccouns[i] ? baseAccouns[i] : null,
          }
        )
      }
      console.log(accountInfoList, 'accountInfoList')
      setConfig(accountInfoList)
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
    setConfig(_config)
  }

  useEffect(() => {
    checkChange()
  }, [config])

  const checkChange = () => {
    const _config = [...config]
    const checkArr = _config.filter(item => item.isCheck)
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

  const copyClick = (value: string) => {
    copy(value)
    messageApi.success('copy success')
  }

  const selectZero = () => {
    const _config = [...config]
    _config.map(item => {
      item.tokenBalance == 0 ? item.isCheck = true : item.isCheck = false
      return item
    })
    setConfig(_config)
  }

  const selectmoreZero = () => {
    const _config = [...config]
    _config.map(item => {
      item.tokenBalance > 0 ? item.isCheck = true : item.isCheck = false
      return item
    })
    setConfig(_config)
  }

  const selectError = () => {
    const _config = [...config]
    _config.map(item => {
      item.state === 2 ? item.isCheck = true : item.isCheck = false
      return item
    })
    setConfig(_config)
  }

  const selectOther = () => {
    const _config = [...config]
    _config.map(item => {
      !item.isCheck ? item.isCheck = true : item.isCheck = false
      return item
    })
    setConfig(_config)
  }

  const deleteCheck = () => {
    const _config = config.filter(item => !item.isCheck)
    setConfig(_config)
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
          <Button onClick={selectZero}>选择余额为0</Button>
          <Button className='ml-2' onClick={selectmoreZero}>选择余额大于0</Button>
          <Button className='ml-2' onClick={selectOther}>反选</Button>
          {!isBot && <Button className='ml-2' onClick={selectError}>选择失败</Button>}
          <Button className='ml-2'><DeleteOutlined onClick={deleteCheck} /></Button>
        </div>
      </div>

      <div className='wallet'>
        <div className='walletHeader'>
          <div className='flex items-center'><Checkbox indeterminate={indeterminate} checked={checkAll} onChange={onCheckAllChange} /></div>
          <div className='flex items-center'>地址</div>
          <div className='flex items-center'>SOL余额</div>
          {isBot && <div className='flex items-center'>价值代币</div>}
          <div className='flex items-center'>代币余额</div>
          {!isBot && <div className='flex items-center'>状态</div>}
          <div className='flex items-center'>移除</div>
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
                  <BsCopy className='ml-2' onClick={() => copyClick(item.walletAddr)} />
                </div>
                <div>{item.balance}</div>
                <div>{item.baseTBalace}</div>
                <div>{item.tokenBalance}</div>
                {!isBot &&
                  <div>{item.state === 0 ? <Button>未执行</Button> :
                    item.state === 1 ? <Tag color="#568ee6">成功</Tag> :
                      <Tag color="red">失败</Tag>}
                  </div>
                }
                <div><DeleteOutlined onClick={() => deleteClick(item.walletAddr, index)} /></div>
              </div>
            ))}
          </div>
        }

      </div>
    </WalletInfoPage>
  )
}

export default WalletInfo