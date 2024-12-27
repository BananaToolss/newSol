import { useEffect, useState } from 'react'
import { message, Segmented, Button, Input, Switch, notification } from 'antd';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { BsCopy } from "react-icons/bs";
import { useTranslation } from "react-i18next";
import copy from 'copy-to-clipboard';
import { AnchorProvider } from "@coral-xyz/anchor";
import base58 from "bs58";
import {
  Keypair, Commitment, LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Input_Style, Button_Style, CREATE_TOKEN_FEE } from '@/config'
import type { TOKEN_TYPE, WalletConfigType } from '@/type'
import { Vanity, UpdataImage, Header, Result, WalletInfo } from '@/components'
import { upLoadImage } from '@/utils/updataNFTImage'
import { PumpFunSDK } from "../src";
import { Page } from '@/styles'
import { CreatePage } from './style'

const { TextArea } = Input
export const DEFAULT_COMMITMENT: Commitment = "finalized";
// 滑点
const SLIPPAGE_BASIS_POINTS = 5000n;

function CreateToken() {

  const { publicKey, sendTransaction } = useWallet()
  const wallet = useWallet()

  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage();
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();

  const [config, setConfig] = useState<TOKEN_TYPE>({
    name: 'Bolt token',
    symbol: 'Bolt2',
    decimals: '9',
    supply: '1000000',
    description: 'Brave Veer & Bolt',
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

  const [isOptions, setIsOptions] = useState(false)
  const [isVanity, setIsVanity] = useState(false)
  const [vanityAddress, setVanityAddress] = useState('')
  const [mintKeypair, setMintKeypair] = useState(Keypair.generate())
  const [isOtherWalletBuy, setIsOtherWalletBuy] = useState(false) //小号钱包买入
  const [transferType, setTransferType] = useState<string | number>(`${t('high speed')}0.001`);

  const [iscreating, setIscreating] = useState(false);
  const [tokenAddresss, setTokenAddresss] = useState("");
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');

  const [walletConfig, setWalletConfig] = useState<WalletConfigType[]>([])

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
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "finalized",
      });
      const sdk = new PumpFunSDK(provider);
      const mint = new Keypair();
      console.log(mint.publicKey.toString(), 'mint.publicKey')
      setTokenAddress(mint.publicKey.toBase58())
      let metadata_url = await upLoadImage(config, imageFile, true)

      const buysersAmounts = []
      let testAccount2: Keypair[] = [];

      if (isOtherWalletBuy) {
        for (let i = 0; i < walletConfig.length; i++) {
          const walletAddr = Keypair.fromSecretKey(base58.decode(walletConfig[i].privateKey));
          testAccount2.push(walletAddr)
        }
      }

      let createResults = await sdk.oneCreateAndBuy(
        config.name,
        config.symbol,
        metadata_url,
        mint,
        wallet,
        BigInt(0.01 * LAMPORTS_PER_SOL),
        testAccount2,
        buysersAmounts,
        SLIPPAGE_BASIS_POINTS,
        'https://mainnet.block-engine.jito.wtf',
        0.0001,
      );
      console.log(createResults, 'createResults')
    } catch (error) {
      console.log(error, 'error')
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

  return (

    <Page>
      {contextHolder}
      {contextHolder1}

      <Header title='Pump开盘并买入'
        hint='在 Pump.fun 开盘时，其他地址同时进行代币买入操作，有效简化交易流程并加速市场参与，快人一步，抢得先机，从而更早获得潜在的收益。' />


      <CreatePage className="my-6">
        <div className='itemSwapper'>
          <div className='item'>
            <div className='mb-1 start'>Token名称</div>
            <Input
              type="text"
              className={Input_Style}
              placeholder='请输入Token名称'
              value={config.name}
              onChange={configChange}
              name='name'
            />
          </div>
          <div className='item'>
            <div className='mb-1 start'>Token符号</div>
            <Input
              type="text"
              className={Input_Style}
              placeholder='请输入Token符号'
              value={config.symbol}
              onChange={configChange}
              name='symbol'
            />
          </div>
        </div>

        <div className='itemSwapper'>
          <div className='item'>
            <div className='mb26 mb10'>
              <div className='mb-1 start'>{t('Supply')}</div>
              <Input
                type="number"
                className={Input_Style}
                placeholder='请输入Token总数'
                value={config.supply}
                onChange={configChange}
                name='supply'
              />
            </div>
            <div>
              <div className='mb-1 start'>Token精度</div>
              <Input
                type="number"
                className={Input_Style}
                placeholder={t('Please enter a Decimals')}
                value={config.decimals}
                onChange={configChange}
                name='decimals'
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

        <div className='flex items-center mb-5'>
          <div className='mr-3 font-semibold'>捆绑买入</div>
          <Switch checked={isOtherWalletBuy} onChange={(e) => setIsOtherWalletBuy(e)} />
        </div>

        <div className='segmentd'>
          <div>{t('Jito Bundle Tips')}：</div>
          <Segmented options={[`${t('default')}0.00003`, `${t('high speed')}0.001`, `${t('extremely fast')}0.01`]}
            value={transferType} onChange={setTransferType}
            size='large' />
        </div>

        {/* <div className='auth_box'>
          <div>{t('Pump.fun同时买入请保证买入钱包有足够的买入金额和 GAS，避免买入失败，同时买入最多设置 1 个地址。')}</div>
        </div> */}

        {isOtherWalletBuy && <WalletInfo config={walletConfig} setConfig={setWalletConfig} />}

        <div className='btn mt-6'>
          <div className='buttonSwapper'>
            <Button className={Button_Style}
              onClick={createToken} loading={iscreating}>
              <span>{t('Token Creator')}</span>
            </Button>
          </div>
          <div className='fee'>全网最低服务费: {CREATE_TOKEN_FEE} SOL</div>
        </div>

        <Result tokenAddress={tokenAddresss} signature={signature} error={error} />
      </CreatePage>
    </Page>

  )
}

export default CreateToken