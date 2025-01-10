import { useState } from 'react'
import { Input, Switch, Segmented } from 'antd'
import { Header, SelectToken } from '@/components'
import { SOL, PUMP } from '@/config/Token'
import { Input_Style, Button_Style, } from '@/config'
import { Page } from '@/styles'
import type { Token_Type } from '@/type'
import { CreateIDPage } from './style'

const OPTIONS = [
  { label: '低配0.29 SOL', value: 1 },
  { label: '中配1.4 SOL', value: 2 },
  { label: '高配2.7 SOL', value: 3 },
]

function CreateID() {
  const [baseToken, setBaseToken] = useState<Token_Type>(SOL)
  const [token, setToken] = useState<Token_Type>(PUMP)
  const [isOptions, setIsOptions] = useState(false)
  const [level, setLevel] = useState(1)

  const baseChange = (_token: Token_Type) => {
    setBaseToken(_token)
  }
  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }
  const levelChange = (e: number) => {
    setLevel(e)
  }
  return (
    <Page>
      <Header title='创建市场ID' hint='创建一个Raydium市场ID,这是添加Raydium AMM流动性池的必要条件' />
      <CreateIDPage>
        <div className='token'>
          <div className='tokenItem mr-5'>
            <div className='mb-1'>基础代币</div>
            <SelectToken selecToken={baseToken} callBack={baseChange} />
          </div>
          <div className='tokenItem'>
            <div className='mb-1'>报价代币</div>
            <SelectToken selecToken={token} callBack={backClick} />
          </div>
        </div>

        <div className='token mt-5'>
          <div className='tokenItem mr-5'>
            <div className='mb-1 start'>最小订单量(最小购买量)</div>
            <Input className={Input_Style} />
          </div>
          <div className='tokenItem'>
            <div className='mb-1'>变动单位(最小价格变动)</div>
            <Input className={Input_Style} />
          </div>
        </div>

        <div className='flex items-center mt-5 options'>
          <div className='mr-3'>高级选项</div>
          <Switch checked={isOptions} onChange={(e) => setIsOptions(e)} />
        </div>

        <div className='mt-5'>
          <Segmented options={[...OPTIONS]} size='large' value={level} onChange={levelChange} />
        </div>
      </CreateIDPage>
    </Page>
  )
}

export default CreateID