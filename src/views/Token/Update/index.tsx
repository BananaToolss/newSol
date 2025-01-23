import { useEffect, useState } from 'react'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Metadata, PROGRAM_ID, DataV2, createUpdateMetadataAccountV2Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from "react-i18next";
import { Button, Input, message, notification } from 'antd'
import { BsXCircleFill, BsCheckCircleFill } from "react-icons/bs";
import { Header, UpdataImage, Result } from '@/components';
import { getAsset } from '@/utils/sol'
import { useConfig } from '@/hooks';
import { upLoadImage } from '@/utils/updataNFTImage'
import { Page } from '@/styles';
import { useIsVip } from '@/hooks';
import { addPriorityFees } from '@/utils'
import type { TOKEN_TYPE } from '@/type'
import { Button_Style, Input_Style, UPDATE_FEE, BANANATOOLS_ADDRESS } from '@/config'
import { CreatePage } from '../CreateToken/style'
import { UpdatePage } from './style'

const { TextArea } = Input


function Update() {
  const { t } = useTranslation()
  const { _rpcUrl } = useConfig()
  const [messageApi, contextHolder] = message.useMessage();
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [tokenAddress, setTokenAddress] = useState('')
  const [isSearch, setIsSearch] = useState(false)
  const [isUpdate, setIsUpdate] = useState(false)
  const vipConfig = useIsVip()
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
  const [isOwner, setIsOwner] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');

  useEffect(() => {
    if (config.owner && publicKey) {
      config.owner === publicKey.toBase58() ? setIsOwner(true) : setIsOwner(false)
    }
  }, [config.owner, publicKey])

  const configChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }

  const getTokenMetadata = async () => {
    try {
      setIsSearch(true)
      const data = await getAsset(connection, tokenAddress, _rpcUrl)
      console.log(data, 'data')
      const {
        name, symbol, description, website, twitter,
        telegram, discord, image, decimals, supply,
        freeze_authority, mint_authority,
        mutable,
        owner,
        metadataUrl
      } = data

      setConfig({
        name, symbol, description, website, twitter,
        telegram, discord, image, decimals, supply,
        freeze_authority, mint_authority,
        mutable,
        owner,
        metadataUrl
      })

      setIsSearch(false)
    } catch (error) {
      console.log(error)
      setIsSearch(false)
      messageApi.error('未查询到该代币信息')
    }
  }

  const updateClick = async () => {
    try {
      setIsUpdate(true)
      setSignature('')
      setError('')
      let metadata_url = ''
      if (imageFile) {
        metadata_url = await upLoadImage(config, imageFile, true)
      } else {
        metadata_url = await upLoadImage(config, config.image, false)
      }
      // metadata_url = 'https://node1.irys.xyz/KEiuNrk9AlTd8LJp5RfLzBYHOk5TwiPXE3lsVA_HbTQ'
      console.log(metadata_url)

      const mint = new PublicKey(tokenAddress)
      const metadataPDA = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
        ],
        PROGRAM_ID,
      )[0]
      const tokenMetadata = {
        name: config.name,
        symbol: config.symbol,
        uri: metadata_url,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
      } as DataV2;

      const updateMetadataTransaction = new Transaction().add(
        createUpdateMetadataAccountV2Instruction(
          {
            metadata: metadataPDA,
            updateAuthority: publicKey,
          },
          {
            updateMetadataAccountArgsV2: {
              data: tokenMetadata,
              updateAuthority: publicKey,
              primarySaleHappened: true,
              isMutable: true,
            },
          }
        )
      );

      if (!vipConfig.isVip) {
        const fee = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
          lamports: UPDATE_FEE * LAMPORTS_PER_SOL,
        })
        updateMetadataTransaction.add(fee)
      }
      //增加费用，减少失败
      const versionedTx = await addPriorityFees(connection, updateMetadataTransaction, publicKey);
      const result = await sendTransaction(versionedTx, connection);

      const confirmed = await connection.confirmTransaction(
        result,
        "processed"
      );
      console.log(confirmed, 'confirmed')
      setIsUpdate(false)
      setSignature(result)
      api.success({ message: '更新成功' })
    } catch (error) {
      console.log(error)
      setIsUpdate(false)
      api.error({ message: error.toString() })
      const err = (error as any)?.message;
      if (
        err.includes(
          "Cannot read properties of undefined (reading 'public_keys')"
        )
      ) {
        setError("It is not a valid Backpack username");
      } else {
        setError(err);
      }
    }
  }

  return (
    <Page>
      {contextHolder}
      {contextHolder1}
      <Header title='代币更新'
        hint='已有代币信息快捷更新，帮助您更好的展示代币相关信息，及时完成项目信息迭代' />

      <UpdatePage>
        <div>
          <div>代币合约地址</div>
          <div className='tokenInput'>
            <div className='input'>
              <Input type="text" className={Input_Style} placeholder='请输入要更新的代币合约地址'
                value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)}
              />
            </div>
            <div className='buttonSwapper'>
              <Button className={Button_Style} loading={isSearch}
                onClick={getTokenMetadata} >
                <span>搜索</span>
              </Button>
            </div>
          </div>
        </div>

        {config.name &&
          <CreatePage className="my-6">
            <div className='itemSwapper'>
              <div className='item authorityBox'>
                <div>元数据修改权</div>
                {config.mutable ?
                  <span className='box'>
                    <BsCheckCircleFill />
                    <span>未放弃</span>
                  </span> :
                  <span className='box1'>
                    <BsXCircleFill />
                    <span>已放弃</span>
                  </span>
                }
              </div>
              <div className='item authorityBox'>
                <div>代币所有权</div>
                {isOwner ?
                  <span className='box'>
                    <BsCheckCircleFill />
                    <span>有</span>
                  </span> :
                  <span className='box1'>
                    <BsXCircleFill />
                    <span>无</span>
                  </span>
                }
              </div>
            </div>

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
                  disabled={!isOwner}
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
                  disabled={!isOwner}
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
                    disabled
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
                    disabled
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
                  placeholder='要更新的代币未填写此信息'
                  value={config.description}
                  onChange={configChange} name='description' disabled={!isOwner} />
              </div>
            </div>

            <div >
              <div className='itemSwapper'>
                <div className='item'>
                  <div className='mb-1'>官网</div>
                  <Input
                    type="text"
                    className={Input_Style}
                    placeholder='要更新的代币未填写此信息'
                    value={config.website}
                    onChange={configChange}
                    name='website' disabled={!isOwner}
                  />
                </div>
                <div className='item'>
                  <div className='mb-1'>X</div>
                  <Input
                    type="text"
                    className={Input_Style}
                    placeholder='要更新的代币未填写此信息'
                    value={config.twitter}
                    onChange={configChange}
                    name='twitter' disabled={!isOwner}
                  />
                </div>
              </div>
              <div className='itemSwapper'>
                <div className='item'>
                  <div className='mb-1'>Telegram</div>
                  <Input
                    type="text"
                    className={Input_Style}
                    placeholder='要更新的代币未填写此信息'
                    value={config.telegram}
                    onChange={configChange}
                    name='telegram' disabled={!isOwner}
                  />
                </div>
                <div className='item'>
                  <div className='mb-1'>Discord</div>
                  <Input
                    type="text"
                    className={Input_Style}
                    placeholder='要更新的代币未填写此信息'
                    value={config.discord}
                    onChange={configChange}
                    name='discord' disabled={!isOwner}
                  />
                </div>
              </div>
              <div className='itemSwapper'>
                <div className='item'>
                  <div className='mb-1'>铸币权</div>
                  <Input
                    type="text"
                    className={Input_Style}
                    placeholder=''
                    value={config.mint_authority}
                    onChange={configChange}
                    name='mint_authority'
                    disabled
                  />
                </div>
                <div className='item'>
                  <div className='mb-1'>冻结权</div>
                  <Input
                    type="text"
                    className={Input_Style}
                    placeholder=''
                    value={config.freeze_authority}
                    onChange={configChange}
                    name='freeze_authority'
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className='btn'>
              <div className='buttonSwapper'>
                <Button className={Button_Style} onClick={updateClick} loading={isUpdate}>
                  <span>确认更新</span>
                </Button>
              </div>
              <div className='fee'>全网最低服务费: {vipConfig.isVip ? 0 : UPDATE_FEE} SOL</div>
            </div>

            <Result signature={signature} error={error} />
          </CreatePage>
        }
      </UpdatePage>



    </Page>
  )
}

export default Update