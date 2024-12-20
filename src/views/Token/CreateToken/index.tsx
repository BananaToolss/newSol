import { useEffect, useState } from 'react'
import { message, Flex, Button, Input, Switch, notification } from 'antd';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { BsCopy } from "react-icons/bs";
import { useTranslation } from "react-i18next";
import copy from 'copy-to-clipboard';
import {
  MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction, createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
} from '@solana/spl-token';
import { Keypair, PublicKey, SystemProgram, Transaction, Commitment, ComputeBudgetProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { createCreateMetadataAccountV3Instruction, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { Input_Style, Button_Style, Text_Style, PROJECT_ADDRESS, CREATE_TOKEN_FEE, Text_Style1 } from '@/config'
import { getTxLink, addPriorityFees } from '@/utils'
import { getAsset } from '@/utils/sol'
import type { TOKEN_TYPE } from '@/type'
import { Vanity, UpdataImage, Header, Hint, Result } from '@/components'
import { upLoadImage } from '@/utils/updataNFTImage'
import { Page } from '@/styles'
import { CreatePage } from './style'

const { TextArea } = Input
export const DEFAULT_COMMITMENT: Commitment = "finalized";

function CreateToken() {

  const { publicKey, sendTransaction } = useWallet()
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage();
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const [isClone, setIsClone] = useState(false)

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
  const [isSearch, setIsSearch] = useState(false)

  useEffect(() => {
    if (window.location.hash && window.location.hash === '#/token/clone') {
      setIsClone(true)
    } else {
      setIsClone(false)
    }
  }, [window.location.hash])

  const [imageFile, setImageFile] = useState(null);

  const [isOptions, setIsOptions] = useState(false)
  const [isVanity, setIsVanity] = useState(false)
  const [vanityAddress, setVanityAddress] = useState('')
  const [mintKeypair, setMintKeypair] = useState(Keypair.generate())

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
  const isVanityChange = (e) => {
    setIsVanity(e)
    setVanityAddress('')
  }

  const getTokenMetadata = async () => {
    try {
      setIsSearch(true)
      const data = await getAsset(connection, tokenAddress)
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
        name, symbol, description,
        website, twitter, telegram, discord,
        decimals, supply,
        freeze_authority, mint_authority,
        mutable,
        owner,
        metadataUrl,
        image,
      })
      setIsOptions(true)
      setIsSearch(false)
    } catch (error) {
      console.log(error)
      setIsSearch(false)
      messageApi.error('未查询到该代币信息')
    }
  }

  const createToken = async () => {
    try {

      if (!publicKey) return messageApi.error(t('Please connect the wallet first'))
      if (!config.name) return messageApi.error(t('Please fill in the name'))
      if (!config.symbol) return messageApi.error(t('Please fill in the short name'))
      if (!config.decimals) return messageApi.error(t('Please fill in the Decimals'))
      if (Number(config.decimals) > 9) return messageApi.error(t('The maximum Decimals is 9'))
      if (!config.supply) return messageApi.error(t('Please fill in the supply quantity'))
      if (!imageFile && !config.image) return messageApi.error(t('Please upload a picture logo'))
      if (config.description && config.description.length > 200) return messageApi.error(t('Description up to 200 words'))

      console.log('createSPLToken')
      setIscreating(true)
      setTokenAddresss('')
      setError('')

      let metadata_url = ''
      if (imageFile) {
        metadata_url = await upLoadImage(config, imageFile, true)
      } else {
        metadata_url = await upLoadImage(config, config.image, false)
      }
      // const metadata_url = 'https://node1.irys.xyz/KEiuNrk9AlTd8LJp5RfLzBYHOk5TwiPXE3lsVA_HbTQ'
      console.log(metadata_url, 'metadata')


      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      // const mintKeypair = Keypair.generate();
      console.log(mintKeypair.publicKey.toBase58(), 'mintKeypair')
      const tokenATA = await getAssociatedTokenAddress(mintKeypair.publicKey, publicKey);

      const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
        {
          metadata: PublicKey.findProgramAddressSync(
            [
              Buffer.from("metadata"),
              PROGRAM_ID.toBuffer(),
              mintKeypair.publicKey.toBuffer(),
            ],
            PROGRAM_ID,
          )[0],
          mint: mintKeypair.publicKey,
          mintAuthority: publicKey,
          payer: publicKey,
          updateAuthority: publicKey,
        },
        {
          createMetadataAccountArgsV3: {
            data: {
              name: config.name,
              symbol: config.symbol,
              uri: metadata_url,
              creators: null,
              sellerFeeBasisPoints: 0,
              uses: null,
              collection: null,
            },
            isMutable: !isRevokeMeta,
            collectionDetails: null,
          },
        },
      );

      const createNewTokenTransaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          Number(config.decimals),
          publicKey,
          isRevokeFreeze ? null : publicKey, //freezeAuthority: PublicKey | null,
          TOKEN_PROGRAM_ID),
        createAssociatedTokenAccountInstruction(
          publicKey,
          tokenATA,
          publicKey,
          mintKeypair.publicKey,
        ),
        createMintToInstruction(
          mintKeypair.publicKey,
          tokenATA,
          publicKey,
          Number((Number(config.supply) * Math.pow(10, Number(config.decimals))).toFixed(0)),
        ),
        createMetadataInstruction,
      );
      if (isRevokeMint) {
        createNewTokenTransaction.add(
          createSetAuthorityInstruction(
            mintKeypair.publicKey,
            publicKey,
            AuthorityType.MintTokens,
            null,
            [],
            TOKEN_PROGRAM_ID
          )
        )
      }

      //增加费用，减少失败
      const versionedTx = await addPriorityFees(connection, createNewTokenTransaction, publicKey);

      const result = await sendTransaction(versionedTx, connection, { signers: [mintKeypair] });
      const confirmed = await connection.confirmTransaction(
        result,
        "processed"
      );
      console.log(confirmed, 'confirmed')
      setSignature(result);
      setTokenAddresss(mintKeypair.publicKey.toBase58())
      setIscreating(false)
      api.success({ message: 'Success' })
    } catch (error: any) {
      api.error({ message: error.toString() })
      console.log(error)
      setIscreating(false)
      setTokenAddresss('')
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

      {isClone ?
        <Header title='代币克隆'
          hint='无需编程，轻松克隆现有的Solana代币：只需输入已有代币的合约地址，即可快速部署一个新的独立代币到Solana区块链上' /> :
        <Header title='Solana代币创建'
          hint='轻松定制您的Solana代币！选择独特且吸引人的数字组合使您的代币更加突出，让您的代币在众多项目中脱颖而出！' />
      }

      {isClone &&
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
      }
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

        <Hint />

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