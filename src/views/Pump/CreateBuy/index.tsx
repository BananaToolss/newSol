import { useEffect, useState } from 'react'
import { message, Segmented, Button, Input, Switch, notification } from 'antd';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { BsCopy } from "react-icons/bs";
import { useTranslation } from "react-i18next";
import copy from 'copy-to-clipboard';
import { AnchorProvider } from "@coral-xyz/anchor";
import base58 from "bs58";
import axios from 'axios'
import {
  Keypair, Commitment, LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Input_Style, Button_Style, PUMP_CREATE_FEE } from '@/config'
import type { TOKEN_TYPE, WalletConfigType } from '@/type'
import { Vanity, UpdataImage, Header, Result, WalletInfo, JitoFee, Hint } from '@/components'
import { upLoadImage } from '@/utils/updataNFTImage'
import { PumpFunSDK } from "../src";
import { Page } from '@/styles'
import { CreatePage } from './style'

const { TextArea } = Input
export const DEFAULT_COMMITMENT: Commitment = "finalized";
// 滑点
const SLIPPAGE_BASIS_POINTS = 5000n;


function CreateToken() {

  const wallet = useWallet()
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage();
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();

  const [config, setConfig] = useState<TOKEN_TYPE>({
    name: '',
    symbol: '',
    decimals: '9',
    supply: '1000000',
    description: '',
    website: '',
    telegram: '',
    twitter: '',
    discord: '',

    image: '',
    freeze_authority: '',
    mint_authority: '',
    mutable: false,
    owner: '',
    metadataUrl: ""
  })
  const [tokenAddress, setTokenAddress] = useState('')
  const [imageFile, setImageFile] = useState(null);
  const [buySol, setBuySol] = useState('')

  const [isOptions, setIsOptions] = useState(false)
  const [isVanity, setIsVanity] = useState(false)
  const [vanityAddress, setVanityAddress] = useState('')
  const [mintKeypair, setMintKeypair] = useState(Keypair.generate())
  const [isOtherWalletBuy, setIsOtherWalletBuy] = useState(false) //小号钱包买入


  const [iscreating, setIscreating] = useState(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');

  const [walletConfig, setWalletConfig] = useState<WalletConfigType[]>([])
  const [jitoFee, setJitoFee] = useState<number>(0)
  const [jitoRpc, setJitoRpc] = useState('')

  const configChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }

  const isVanityChange = (e) => {
    setIsVanity(e)
    setVanityAddress('')
  }

  //创建代币
  const createToken = async () => {
    try {

      if (!wallet.publicKey) return messageApi.error(t('Please connect the wallet first'))
      if (!config.name) return messageApi.error(t('Please fill in the name'))
      if (!config.symbol) return messageApi.error(t('Please fill in the short name'))
      if (!imageFile && !config.image) return messageApi.error(t('Please upload a picture logo'))

      const balance = await connection.getBalance(wallet.publicKey)
      console.log(balance, 'balance')
      setIscreating(true)
      setSignature('')
      setError('')
      setTokenAddress('')

      const provider = new AnchorProvider(connection, wallet, {
        commitment: "finalized",
      });
      const sdk = new PumpFunSDK(provider);
      const mint = mintKeypair

      console.log(mint.publicKey.toString(), 'mint')
      let metadata_url = await upLoadImage(config, imageFile, true)
      // let metadata_url = '1'

      console.log(metadata_url, 'metadata_url')
      console.log(jitoRpc, jitoFee, 'jitoRpcjitoFee, ')
      const buysersAmounts = []
      let testAccount2: Keypair[] = [];

      if (isOtherWalletBuy) {
        for (let i = 0; i < walletConfig.length; i++) {
          const walletAddr = Keypair.fromSecretKey(base58.decode(walletConfig[i].privateKey));
          testAccount2.push(walletAddr)
          buysersAmounts.push(walletConfig[i].buySol)
        }
      }

      if (testAccount2.length !== buysersAmounts.length) {
        messageApi.error(t('捆绑参数未填写完整'))
        setIscreating(false)
        return
      }

      let result = await sdk.oneCreateAndBuy(
        config.name,
        config.symbol,
        metadata_url,
        mint,
        wallet,
        BigInt(Number(buySol) * LAMPORTS_PER_SOL),
        testAccount2,
        buysersAmounts,
        SLIPPAGE_BASIS_POINTS,
        jitoRpc,
        jitoFee,
      );

      console.log(result, 'result')
      if (result.type == 'success') { //直接创建
        api.success({ message: '创建成功' })
        setTokenAddress(mint.publicKey.toBase58())
        setSignature(result.message)

      } else if (result.type == 'success1') { //捆绑
        const bundleId = result.message
        const explorerUrl = `https://explorer.jito.wtf/bundle/${bundleId}`;
        console.log(explorerUrl)
        setSignature(explorerUrl)
        getBundleStatuses(bundleId)
      } else {
        api.error({ message: result.message })
        setError(result.message)
      }
      setIscreating(false)
    } catch (error: any) {
      console.log(error, 'error')
      api.error({ message: error.message })
      setError(error.message)
      setIscreating(false)
    }
  }

  const getBundleStatuses = async (bundleId: string) => {
    try {
      const endpoints = `${jitoRpc}/api/v1/bundles`
      const res = await axios.post(endpoints, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getInflightBundleStatuses',
        params: [[bundleId]],
      })
      const result = res.data.result
      console.log(result, 'result')
      const state = result.value[0].status
      console.log(state, 'state')

      if (state === 'Pending') {
        setTimeout(() => {
          getBundleStatuses(bundleId)
        }, 1000)
      } else if (state === 'Failed') {
        console.log('失败')
      } else if (state === 'Landed') {
        console.log('成功')
      } else {
        console.log('不在系统中')
      }
    } catch (error: any) {
      console.error('检查包状态时出错:', error);
    }
  }

  const copyClickV = () => {
    copy(vanityAddress)
    messageApi.success('copy success')
  }

  const callBack = (secretKey: Uint8Array) => {
    const _Keypair = Keypair.fromSecretKey(secretKey)
    setMintKeypair(_Keypair)
    setVanityAddress(_Keypair.publicKey.toBase58())
  }

  const jitoCallBack = (jitoFee_: number, jitoRpc_: string) => {
    setJitoFee(jitoFee_)
    setJitoRpc(jitoRpc_)
  }

  return (
    <Page>
      {contextHolder}
      {contextHolder1}

      <Header title='Pump开盘并买入'
        hint='在 Pump.fun 开盘时，其他地址同时进行代币买入操作，有效简化交易流程并加速市场参与，快人一步，抢得先机，从而更早获得潜在的收益。' />


      <CreatePage className="my-6">

        <div className='itemSwapper'>
          <div className='item'>
            <div className='mb26 mb10'>
              <div className='mb-1 start'>Token名称</div>
              <Input
                className={Input_Style}
                placeholder='请输入Token名称'
                value={config.name}
                onChange={configChange}
                name='name'
              />
            </div>
            <div>
              <div className='mb-1 start'>Token符号</div>
              <Input
                className={Input_Style}
                placeholder={t('请输入Token符号')}
                value={config.symbol}
                onChange={configChange}
                name='symbol'
              />
            </div>
          </div>

          <div className='item'>
            <div className='mb-1 start'>Token Logo</div>
            <div className='flex imgswapper'>
              <UpdataImage setImageFile={setImageFile} image={config.image} />
              <div className='imagetext'>
                <div>
                  <div>支持图片格式：WEBP/PNG/GIF/JPG</div>
                  <div>建议尺寸大小 1000x1000像素</div>
                </div>
                <div className='hit'>符合以上要求，可以在各个平台和应用中更好的展示</div>
              </div>
            </div>
          </div>
        </div>

        <div className='itemSwapper'>
          <div className='textarea'>
            <div className='mb-1'>{t('Describe')}（选填）</div>
            <TextArea
              className={Input_Style}
              placeholder='请输入Token描述'
              value={config.description}
              onChange={configChange} name='description' />
          </div>
        </div>

        <div className='itemSwapper'>
          <div className='textarea'>
            <div className='mb-1 start'>购买数量（SOL）</div>
            <Input
              className={Input_Style}
              placeholder='请输入需要购买的数量sol'
              value={buySol}
              onChange={(e) => setBuySol(e.target.value)} />
          </div>
        </div>

        <div className='flex items-center mb-5 options'>
          <div className='mr-3 font-semibold'>添加社交链接</div>
          <Switch checked={isOptions} onChange={(e) => setIsOptions(e)} />
        </div>
        {isOptions &&
          <div >
            <div className='itemSwapper'>
              <div className='item'>
                <div className='mb-1'>官网</div>
                <Input
                  type="text"
                  className={Input_Style}
                  placeholder='请输入您的官网链接'
                  value={config.website}
                  onChange={configChange}
                  name='website'
                />
              </div>
              <div className='item'>
                <div className='mb-1'>X</div>
                <Input
                  type="text"
                  className={Input_Style}
                  placeholder='请输入您的推特链接'
                  value={config.twitter}
                  onChange={configChange}
                  name='twitter'
                />
              </div>
            </div>
            <div className='itemSwapper'>
              <div className='item'>
                <div className='mb-1'>Telegram</div>
                <Input
                  type="text"
                  className={Input_Style}
                  placeholder='请输入您的Telegram链接'
                  value={config.telegram}
                  onChange={configChange}
                  name='telegram'
                />
              </div>
              <div className='item'>
                <div className='mb-1'>Discord</div>
                <Input
                  type="text"
                  className={Input_Style}
                  placeholder='请输入您的Discord'
                  value={config.discord}
                  onChange={configChange}
                  name='discord'
                />
              </div>
            </div>
          </div>
        }

        <div className='flex items-center mb-5 options'>
          <div className='mr-3 font-semibold'>创建靓号代币</div>
          <Switch checked={isVanity} onChange={isVanityChange} />
        </div>
        {isVanity && <Vanity callBack={callBack} />}
        {isVanity && vanityAddress &&
          <div className='vanity'>
            <div className='text-base'>靓号代币合约</div>
            <div className='font-medium'>{vanityAddress}</div>
            <BsCopy onClick={copyClickV} style={{ marginLeft: '6px' }} className='pointer' />
          </div>}

        <div className='flex items-center mb-5 options'>
          <div className='mr-3 font-semibold'>捆绑买入</div>
          <Switch checked={isOtherWalletBuy} onChange={(e) => setIsOtherWalletBuy(e)} />
        </div>

        {isOtherWalletBuy &&
          <>
            <JitoFee callBack={jitoCallBack} />
            <WalletInfo config={walletConfig} setConfig={setWalletConfig} />
          </>
        }

        <Hint title='当仅导入一个地址时(共2个地址买入) ,无需使用Jito捆绑功能,可能会提高成功率。' />
        <Hint title={`买入地址超过2个时,需要使用 Jito的捆绑功能。请尽量保证Jito服务器延迟在 200ms 以内。为提高成功率,在弹出钱包后,请尽快确认。
          若捆绑失败,无任何费用,请尝试更换VPN节点,并考虑在链上活跃度较低的时段再次尝试
          `} />

        <div className='btn mt-6'>
          <div className='buttonSwapper'>
            <Button className={Button_Style}
              onClick={createToken} loading={iscreating}>
              <span>{t('Token Creator')}</span>
            </Button>
          </div>
          <div className='fee'>全网最低服务费: {PUMP_CREATE_FEE} SOL</div>
        </div>

        <Result tokenAddress={tokenAddress} signature={signature} error={error} />
      </CreatePage>
    </Page>

  )
}

export default CreateToken