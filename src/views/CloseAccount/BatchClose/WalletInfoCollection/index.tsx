import { useState, SetStateAction, Dispatch, useEffect } from 'react'
import { Button, message, notification, Tag, Checkbox, Switch } from 'antd'
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
import { SOL_TOKEN } from '@/config/Token';
import type { CollocetionType } from '@/type'
import PrivateKeyPage from './PrivateKeyPage'
import { delay, SliceAddress } from "@/utils";
import { ConfigType } from '../index'
import {
  WalletInfoPage
} from './style'


interface PropsType {
  config: ConfigType[]
  setConfig: Dispatch<SetStateAction<ConfigType[]>>
}

function WalletInfo(props: PropsType) {
  const { config, setConfig } = props

  const [api, contextHolder1] = notification.useNotification();
  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();


  const [selectedItems, setSelectedItems] = useState<any[]>([])


  const [privateKeys, setPrivateKeys] = useState([]) //私钥数组
  const [isLoading, setIsLoading] = useState(false)
  const [isOptionsAll, setIsOptionsAll] = useState(false)

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

  const getWalletsInfo = async (keys?: string[]) => {
    try {
      setSelectedItems([])

      const config = keys ? keys : privateKeys
      const _config = []
      setIsLoading(true)
      for (let index = 0; index < config.length; index++) {
        const emptyArr: any[] = [];
        const user = Keypair.fromSecretKey(bs58.decode(config[index]));
        const walletPubkey = user.publicKey;
        const accountList = await connection.getParsedTokenAccountsByOwner(
          walletPubkey as any,
          {
            programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          },
        );
        accountList.value.forEach(account => {
          const tokenAccountPubkey = account.pubkey;
          const tokenAccountAmount = account.account.data.parsed.info.tokenAmount;
          if (tokenAccountAmount.uiAmount == 0) {
            emptyArr.push(tokenAccountPubkey.toString())
          }
        });
        const accountConfig: ConfigType = {
          privateKey: config[index],
          address: walletPubkey.toBase58(),
          allAccount: accountList.value.length.toString(),
          emptyAccount: emptyArr.length.toString(),
          value: Number(emptyArr.length * 0.002039).toFixed(6),
          value1: Number(accountList.value.length * 0.002039).toFixed(6),
          isCheck: false,
          state: false,
          emptyAccounts: emptyArr
        }
        _config.push(accountConfig)
        await delay(40)
      }
      setConfig(_config)
      setIsLoading(false)
    } catch (error) {
      console.log(error, 'error')
      api.error({ message: error.toString() })
      setIsLoading(false)
    }
  }

  const deleteClick = (account: string, index: number) => {
    const _config = config.filter(item => item.address !== account)
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
          <Button className={`${Button_Style1} ml-2 baba`} onClick={() => getWalletsInfo()}>刷新账户信息</Button>
        </div>
        <div className='flex items-center h-100 flex-wrap'>
          <Switch checked={!isOptionsAll} onChange={(e) => setIsOptionsAll(!isOptionsAll)} /> <div className='text-sm ml-1 mr-2'>仅回收空账户</div>
          <Switch checked={isOptionsAll} onChange={(e) => setIsOptionsAll(!isOptionsAll)} /> <div className='text-sm ml-1 mr-2'>回收所有账户</div>

          <Button className='ml-2 ba' onClick={selectOther}>反选</Button>
          <Button className='ml-2 ba'><DeleteOutlined onClick={deleteCheck} /></Button>
        </div>
      </div>

      <div className='wallet'>
        <div className='walletHeader'>
          <div className='flex items-center'><Checkbox indeterminate={indeterminate} checked={checkAll} onChange={onCheckAllChange} /></div>
          <div className='flex items-center'>地址</div>
          <div className='flex items-center'>所有账户</div>
          <div className='flex items-center'>空账户</div>
          <div className='flex items-center'>可领取/SOL</div>
          <div className='flex items-center'>状态</div>
          <div className='flex items-center'>操作</div>
        </div>
        {isLoading && <LoadingOut title='钱包信息加载中...' />}
        {!isLoading &&
          <div className='waletSwapper'>
            {config.map((item, index) => (
              <div className='walletInfo' key={item.address}>
                <div>
                  <span>
                    <Checkbox className='mr-2' checked={item.isCheck} onChange={itemOnCheckChange} name={`${index}`} />
                    {index + 1}
                  </span>
                </div>
                <div className='flex items-center'>
                  <span>{addressHandler(item.address)} </span>
                  <BsCopy className='ml-2' onClick={() => copyClick(item.address)} />
                </div>
                <div>{item.allAccount}</div>
                <div>{item.emptyAccount}</div>
                <div>{item.value}</div>
                <div>{!item.state ? <Button>未领取</Button> : <Tag color="#568ee6">成功</Tag>}
                </div>
                <div><DeleteOutlined onClick={() => deleteClick(item.address, index)} /></div>
              </div>
            ))}
          </div>
        }

      </div>
    </WalletInfoPage>
  )
}

export default WalletInfo