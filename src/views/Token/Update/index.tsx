import { useState } from 'react'
import { PublicKey } from '@solana/web3.js';
import { Metadata, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { useConnection } from '@solana/wallet-adapter-react';
import { useTranslation } from "react-i18next";
import { Button, Input } from 'antd'
import { Header, UpdataImage } from '@/components';
import { getAsset } from '@/utils/sol'
import { Page } from '@/styles';
import { fetcher } from '@/utils'
import type { TOKEN_TYPE } from '@/type'
import { Button_Style, Input_Style } from '@/config'
import { CreatePage } from '../CreateToken/style'
import { UpdatePage } from './style'

const { TextArea } = Input


function Update() {
  const { t } = useTranslation()
  const { connection } = useConnection()
  const [tokenAddress, setTokenAddress] = useState('AsLhTDywyQT8L4dtceWKX7knxGn4n2v2QAkQRX6ANbmX')

  const [config, setConfig] = useState({
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
    mint_authority: ''
  })
  const [imageFile, setImageFile] = useState(null);

  const configChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }

  const getTokenMetadata = async () => {
    try {
      const data = await getAsset(tokenAddress)
      console.log(data, 'data')
      const token_info = data.token_info
      const metadata = data.content.metadata

      const name = metadata.name
      const symbol = metadata.symbol

      const description = metadata.description ?? ''
      const website = metadata.website ?? ''
      const telegram = metadata.telegram ?? ''
      const discord = metadata.discord ?? ''
      const twitter = metadata.twitter ?? ''


      const image = data.content.links.image ?? ''

      const decimals = token_info.decimals
      const supply = (token_info.supply / 10 ** token_info.decimals).toString()
      const freeze_authority = token_info.freeze_authority ?? ''
      const mint_authority = token_info.mint_authority ?? ''

      setConfig({
        name, symbol, description, website, twitter,
        telegram, discord, image, decimals, supply,
        freeze_authority, mint_authority
      })

      console.log(name, symbol, description, website, twitter,
        telegram, discord, image, decimals, supply,
        freeze_authority, mint_authority)

    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Page>
      <Header title='代币更新'
        hint='已有代币信息快捷更新，帮助您更好的展示代币相关信息，及时完成项目信息迭代' />

      <UpdatePage>
        <div>
          <div>代币合约地址</div>
          <div className='tokenInput'>
            <div className='input'>
              <input type="text" className={Input_Style} placeholder='请输入要更新的代币合约地址'
                value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)}
              />
            </div>
            <div className='buttonSwapper'>
              <Button className={Button_Style}
                onClick={getTokenMetadata} >
                <span>搜索</span>
              </Button>
            </div>
          </div>
        </div>
      </UpdatePage>

      <CreatePage className="my-6">
        <div className='itemSwapper'>
          <div className='item'>
            <div className='mb-1 start'>Token名称</div>
            <input
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
            <input
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
              <input
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
              <input
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

        <div >
          <div className='itemSwapper'>
            <div className='item'>
              <div className='mb-1'>官网</div>
              <input
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
              <input
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
              <input
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
              <input
                type="text"
                className={Input_Style}
                placeholder='请输入您的Discord'
                value={config.discord}
                onChange={configChange}
                name='discord'
              />
            </div>
          </div>
          <div className='itemSwapper'>
            <div className='item'>
              <div className='mb-1'>铸币权</div>
              <input
                type="text"
                className={Input_Style}
                placeholder=''
                value={config.mint_authority}
                onChange={configChange}
                name='mint_authority'
              />
            </div>
            <div className='item'>
              <div className='mb-1'>冻结权</div>
              <input
                type="text"
                className={Input_Style}
                placeholder=''
                value={config.freeze_authority}
                onChange={configChange}
                name='freeze_authority'
              />
            </div>
          </div>
        </div>


        <div className='btn'>
          <div className='buttonSwapper'>
            <Button className={Button_Style} >
              <span>{t('Token Creator')}</span>
            </Button>
          </div>
          <div className='fee'>全网最低服务费: 1 SOL</div>
        </div>
      </CreatePage>

    </Page>
  )
}

export default Update