import { useState, SetStateAction, Dispatch, useEffect } from 'react'
import { Button, message, notification, Tag, Checkbox, Switch, Modal } from 'antd'
import type { CheckboxChangeEvent } from 'antd'
import {
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { BsCopy } from "react-icons/bs";
import { DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { getAllToken } from '@/utils/newSol'
import copy from 'copy-to-clipboard';
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { addressHandler } from '@/utils'
import { LoadingOut } from '@/components'
import { Button_Style1, Button_Style } from '@/config'
import { SOL_TOKEN } from '@/config/Token';
import type { Token_Type } from '@/type'
import type { CloseConfigType } from '../index'
import PrivateKeyPage from './PrivateKeyPage'
import { delay, SliceAddress } from "@/utils";
import {
  WalletInfoPage
} from './style'


interface PropsType {
  isOptionsAll: boolean
  setIsOptionsAll: Dispatch<SetStateAction<boolean>>
  config: CloseConfigType[]
  setConfig: Dispatch<SetStateAction<CloseConfigType[]>>
}

export const getClaimValue = (item: CloseConfigType, isOptionsAll: boolean) => {
  let balance = '0'
  if (!isOptionsAll) {
    balance = (item.emptyNumber * 0.002039).toFixed(6)
  } else {
    balance = (item.info.length * 0.002039).toFixed(6)
  }
  return balance
}

function WalletInfo(props: PropsType) {
  const { isOptionsAll, setIsOptionsAll, config, setConfig } = props

  const [api, contextHolder1] = notification.useNotification();
  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();

  const [privateKeys, setPrivateKeys] = useState([]) //私钥数组
  const [isLoading, setIsLoading] = useState(false)


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

  const getWalletsInfo = async (keys?: string[]) => {
    try {
      const config = keys ? keys : privateKeys
      const _config: CloseConfigType[] = []
      setIsLoading(true)
      for (let index = 0; index < config.length; index++) {
        const user = Keypair.fromSecretKey(bs58.decode(config[index]));
        const walletPubkey = user.publicKey;
        const accountList = await connection.getParsedTokenAccountsByOwner(
          walletPubkey as any,
          {
            programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          },
        );
        const data = accountList.value
        // const data = await getAllToken(walletPubkey.toBase58())
        const tokenArr: Token_Type[] = []
        const tokenArr0: Token_Type[] = []
        data.forEach((item) => {
          const associatedAccount = item.pubkey;
          const tokenAccountAmount = item.account.data.parsed.info.tokenAmount;
          const token: Token_Type = {
            address: item.account.data.parsed.info.mint,
            name: '',
            symbol: '',
            decimals: tokenAccountAmount.decimals,
            image: '',
            balance: tokenAccountAmount.uiAmount,
            isSelect: false,
            associatedAccount: associatedAccount.toBase58(),
          }
          tokenArr.push(token)
          if (Number(tokenAccountAmount.uiAmount) == 0) tokenArr0.push(token)
        })
        console.log(tokenArr0, 'tokenArr0')
        const _accounInfo: CloseConfigType = {
          account: walletPubkey.toBase58(),
          info: tokenArr,
          privateKey: config[index],
          emptyNumber: tokenArr0.length,
          isCheck: false,
          state: 0
        }
        _config.push(_accounInfo)
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
    const _config = config.filter(item => item.account !== account)
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

  const isAlloptions = () => {
    if (!isOptionsAll) {
      showModal()
    }
    setIsOptionsAll(!isOptionsAll)

  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <WalletInfoPage>
      {contextHolder}
      {contextHolder1}

      <Modal title="温馨提示" open={isModalOpen} onOk={handleOk} onCancel={handleCancel} footer={null}>
        <div className='text-lg mt-5 font-bold'>非空账户回收会燃烧Toke或NFT，请确保代币已无价值</div>
        <div className='buttonSwapper mt-4 text-center'>
          <Button className={Button_Style} onClick={handleOk}>确认</Button>
        </div>
      </Modal>

      <div className='header'>钱包信息</div>

      <div className='flex items-center btns'>
        <div className='buttonSwapper'>
          <PrivateKeyPage privateKeys={privateKeys} callBack={privateKeyCallBack} title='导入钱包' />
          <Button className={`${Button_Style1} ml-2 baba`} onClick={() => getWalletsInfo()}>刷新账户信息</Button>
        </div>
        <div className='flex items-center h-100 flex-wrap'>
          <Switch checked={!isOptionsAll} onChange={isAlloptions} /> <div className='text-sm ml-1 mr-2'>仅回收空账户</div>
          <Switch checked={isOptionsAll} onChange={isAlloptions} /> <div className='text-sm ml-1 mr-2'>回收所有账户</div>

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
              <div className='walletInfo' key={item.account}>
                <div>
                  <span>
                    <Checkbox className='mr-2' checked={item.isCheck} onChange={itemOnCheckChange} name={`${index}`} />
                    {index + 1}
                  </span>
                </div>
                <div className='flex items-center'>
                  <span>{addressHandler(item.account)} </span>
                  <BsCopy className='ml-2' onClick={() => copyClick(item.account)} />
                </div>
                <div>{item.info.length}</div>
                <div>{item.emptyNumber}</div>
                <div>{getClaimValue(item, isOptionsAll)}</div>
                <div>{!item.state ? <Button>未领取</Button> : <Tag color="#568ee6">成功</Tag>}
                </div>
                <div><DeleteOutlined onClick={() => deleteClick(item.account, index)} /></div>
              </div>
            ))}
          </div>
        }

      </div>
    </WalletInfoPage>
  )
}

export default WalletInfo