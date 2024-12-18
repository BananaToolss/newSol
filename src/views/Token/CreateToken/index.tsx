import { useState } from 'react'
import { message, Flex, Button, Input, Switch } from 'antd';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { BsCopy } from "react-icons/bs";
import { useTranslation } from "react-i18next";
import copy from 'copy-to-clipboard';
import { Input_Style, Button_Style, Text_Style, PROJECT_ADDRESS, CREATE_TOKEN_FEE } from '@/config'
import UpdataImage from '@/components/updaImage'
import { getTxLink } from '@/utils'
import {
  Page,
  CreatePage
} from './style'

interface TOKEN_TYPE {
  name: string
  symbol: string
  decimals: string
  amount: string
  description: string
  website: string
  telegram: string
  twitter: string
  discord: string
  tags: string
}

const { TextArea } = Input

function CreateToken() {

  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();

  const [config, setConfig] = useState<TOKEN_TYPE>({
    name: '',
    symbol: '',
    decimals: '9',
    amount: '1000000',
    description: '',
    website: '',
    telegram: '',
    twitter: '',
    discord: '',
    tags: 'Meme,NFT,DEFI'
  })

  const [imageFile, setImageFile] = useState(null);

  const [isOptions, setIsOptions] = useState(false)

  const [isRevokeFreeze, setIsRevokeFreeze] = useState(false)
  const [isRevokeMint, setIsRevokeMint] = useState(false)
  const [isRevokeMeta, setIsRevokeMeta] = useState(false)

  const [iscreating, setIscreating] = useState(false);
  const [tokenAddresss, setTokenAddresss] = useState("");
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');

  const configChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }

  const createToken = () => {

  }

  const copyClick = () => {
    copy(tokenAddresss)
    messageApi.success('copy success')
  }

  return (

    <Page>
      <div className={Text_Style}>Solana代币创建</div>
      <div className="text-center w100">
        <CreatePage className="my-6">
          {contextHolder}

          <div className='flex items-center mb-5'>
            <div className='titlea mr-3'>{t('Name')}：</div>
            <input
              type="text"
              className={Input_Style}
              placeholder={t('Please enter a name (eg: BananaTools)')}
              value={config.name}
              onChange={configChange}
              name='name'
            />
          </div>

          <div className='flex items-center mb-5'>
            <div className='titlea mr-3'>{t('Symbol')}：</div>
            <input
              type="text"
              className={Input_Style}
              placeholder={t('Please enter a Symbol (eg: BT)')}
              value={config.symbol}
              onChange={configChange}
              name='symbol'
            />
          </div>

          <div className='flex items-center mb-5'>
            <div className='titlea mr-3'>{t('Supply')}：</div>
            <input
              type="number"
              className={Input_Style}
              placeholder={t('Please enter a Supply')}
              value={config.amount}
              onChange={configChange}
              name='amount'
            />
          </div>

          <div className='flex items-center mb-5'>
            <div className='titlea mr-3'>{t('Decimals')}：</div>
            <input
              type="number"
              className={Input_Style}
              placeholder={t('Please enter a Decimals')}
              value={config.decimals}
              onChange={configChange}
              name='decimals'
            />
          </div>

          <div className='flex items-center mb-5'>
            <div className='titlea mr-3'>{t('Image')}：</div>
            <UpdataImage setImageFile={setImageFile} />
          </div>

          <div className='flex items-center mb-5'>
            <div className='titlea mr-3'>{t('Open optional content')}：</div>
            <Switch checked={isOptions} onChange={(e) => setIsOptions(e)} />
          </div>

          {isOptions &&
            <>
              <div className='flex items-center mb-3'>
                <div className='titlea mr-3'>{t('Website')}：</div>
                <input
                  type="text"
                  className={Input_Style}
                  placeholder={`${t('Optional, such as')}:https://bananatools.top`}
                  value={config.website}
                  onChange={configChange}
                  name='website'
                />
              </div>
              <div className='flex items-center mb-3'>
                <div className='titlea mr-3'>Telegram：</div>
                <input
                  type="text"
                  className={Input_Style}
                  placeholder={`${t('Optional, such as')}:https://t.me/BananaTools`}
                  value={config.telegram}
                  onChange={configChange}
                  name='telegram'
                />
              </div>
              <div className='flex items-center mb-3'>
                <div className='titlea mr-3'>{t('Twitter')}：</div>
                <input
                  type="text"
                  className={Input_Style}
                  placeholder={`${t('Optional, such as')}:https://x.com/BalanaTools`}
                  value={config.twitter}
                  onChange={configChange}
                  name='twitter'
                />
              </div>
              <div className='flex items-center mb-3'>
                <div className='titlea mr-3'>Discord：</div>
                <input
                  type="text"
                  className={Input_Style}
                  placeholder={`${t('Optional, such as')}:https://discord`}
                  value={config.discord}
                  onChange={configChange}
                  name='discord'
                />
              </div>
              <div className='flex items-center mb-5'>
                <div className='titlea mr-3'>{t('Describe')}：</div>
                <TextArea
                  className={Input_Style}
                  placeholder={t('Optional, up to 200 words')}
                  value={config.description}
                  onChange={configChange} name='description' />
              </div>
              <div className='flex items-center mb-5'>
                <div className='titlea mr-3'>{t('Tags')}：</div>
                <TextArea
                  className={Input_Style}
                  placeholder="Meme,NFT,DEFI"
                  value={config.tags}
                  onChange={configChange} name='tags' />
              </div>
            </>
          }

          <div className='flex items-center mb-5 '>

            <div className='flex flex-wrap justify-between flex-1'>
              <div className='authority_box'>
                <div className='authority_titlt'>
                  <div>{t('Give up the right to modify metadata')}</div>
                  <div>
                    <Switch checked={isRevokeMeta} onChange={(e) => setIsRevokeMeta(e)} />
                  </div>
                </div>
                <div className='authority_content'>
                  {t(`'Relinquishing ownership' means that you will not be able to modify the token metadata. It does help to make investors feel more secure.`)}
                </div>
              </div>

              <div className='authority_box'>
                <div className='authority_titlt'>
                  <div className='mr-1'>{t('Give up the right to freeze')}</div>
                  <div>
                    <Switch checked={isRevokeFreeze} onChange={(e) => setIsRevokeFreeze(e)} />
                  </div>
                </div>
                <div className='authority_content'>
                  {t(`'Waiver of the right to freeze' means that you cannot restrict a specific account from doing things like sending transactions.`)}
                </div>
              </div>

              <div className='authority_box'>
                <div className='authority_titlt'>
                  <div>{t('Give up the right to mint money')}</div>
                  <div>
                    <Switch checked={isRevokeMint} onChange={(e) => setIsRevokeMint(e)} />
                  </div>
                </div>
                <div className='authority_content'>
                  {t('“Giving up minting rights” is necessary for investors to feel more secure and successful as a token. If you give up your right to mint, it means you will not be able to mint more of the token supply.')}
                </div>
              </div>

            </div>
          </div>

          <div className='buttonSwapper'>
            <Button className={Button_Style}
              onClick={createToken} loading={iscreating}>
              <span>{t('Token Creator')}</span>
            </Button>
          </div>
          <div className='fee'>{t('Fee')}: {CREATE_TOKEN_FEE} SOL</div>


          <div >
            {tokenAddresss !== "" &&
              <div className="mt-5 text-start">
                ✅ {t('Created successfully!')}
                <a target="_blank" href={getTxLink(signature)} rel="noreferrer">
                  <strong className="underline">{t('Click to view')}</strong>
                </a>
                <div className='flex'>
                  <div className={Text_Style}>{tokenAddresss} </div>
                  <BsCopy onClick={copyClick} style={{ marginLeft: '6px' }} className='pointer' />
                </div>
              </div>
            }
            {error != '' && <div className="mt-2">❌ Ohoh.. {error}</div>}
          </div>
        </CreatePage>
      </div>
    </Page>

  )
}

export default CreateToken