import { useState, useEffect } from 'react';
import { Select, Space, Flex } from 'antd';
import type { SelectProps } from 'antd';
import styled from 'styled-components';
import { fetchAllDigitalAssetWithTokenByOwner } from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { useTranslation } from "react-i18next";


export interface TokenDeta_Type {
  address: string //代币地址
  symbol: string  //简称
  amount: bigint //数量
  decimals: number // 精度
}

const SelectPage = styled.div`
width: 100%;
`

interface PropsType {
  callBack: (e: TokenDeta_Type) => void
}

const App = (props: PropsType) => {
  const { callBack } = props
  const { t } = useTranslation()
  const { connection } = useConnection();
  const wallet = useWallet();
  const umi = createUmi(connection);

  const [userSPL, setUserSPL] = useState<TokenDeta_Type[]>([])
  const [options, setOptions] = useState<SelectProps['options']>([])

  useEffect(() => {
    if (wallet && wallet.publicKey) {
      getMyTokenList()
    }
  }, [wallet])
  useEffect(() => {
    if (userSPL && userSPL.length > 0) dataArrHandler()
  }, [userSPL])


  //获取资产
  const getMyTokenList = async () => {
    let tokenList = await fetchAllDigitalAssetWithTokenByOwner(
      umi,
      fromWeb3JsPublicKey(wallet.publicKey)
    );
    console.log(tokenList)
    const _arr: TokenDeta_Type[] = []
    tokenList.forEach((item, index) => {
      const _token = {
        symbol: item.metadata.name,
        address: item.publicKey.toString(),
        decimals: item.mint.decimals,
        amount: item.token.amount
      }
      _arr.push(_token)
    })
    setUserSPL(_arr)
  }

  const dataArrHandler = () => {
    const itemNodeArr: SelectProps['options'] = []
    userSPL.forEach((item, index) => {
      const itemNode = {
        label:
          <Flex align='center' justify='space-between'>
            {/* <img src={item.url} width={40} height={40} /> */}
            <div style={{ margin: '0 4px 0 10px', fontSize: '18px' }}>{item.symbol}</div>
            <div>{item.address}</div>
            <div>余额：{(item.amount / BigInt(10 ** item.decimals)).toString()}</div>
          </Flex>,
        value: index
      }
      itemNodeArr.push(itemNode)
    })
    setOptions(itemNodeArr)
  }

  const handleChange = (value: string[]) => {
    callBack(userSPL[Number(value)])
  };


  return (
    <SelectPage>
      <Space style={{ width: '100%' }} direction="vertical">
        <Select
          style={{ width: '100%' }}
          placeholder={t('Choose your token')}
          onChange={handleChange}
          options={options}
        />
      </Space>
    </SelectPage>

  )
};

export default App;