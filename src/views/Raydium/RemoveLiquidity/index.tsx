import { useEffect, useState } from 'react'
import { Button, notification, Segmented, Input, Flex, Spin } from 'antd'
import { Page } from '@/styles'
import { Header, SelectToken, Result } from '@/components'
import AMM from './AMM'
import CPMM from './CPMM'


const SGECONFIG = [
  { label: 'AMM OpenBook ID', value: 1 },
  { label: 'CPMM', value: 2 },
  // { label: 'CLMM-稳定池', value: 3 },
]

function CreateLiquidity() {
  const [api, contextHolder1] = notification.useNotification();

  const [pooltype, setPoolType] = useState(1)

  const pooltypeChange = (e) => {
    setPoolType(e)
  }

  return (
    <Page>
      {contextHolder1}
      <Header title='移除流动性' hint='移除当前代币的AMM流动性,并收回流动性池内所有的报价代币(SOL),移除流动性后代币将无法交易,流动性池内的资金会自动回流到创建者钱包' />
      <div className='mb-5'>
        <Segmented options={SGECONFIG} size='large' value={pooltype} onChange={pooltypeChange} />
      </div>

      {pooltype === 1 && <AMM />}
      {pooltype === 2 && <CPMM />}
    </Page>
  )
}

export default CreateLiquidity