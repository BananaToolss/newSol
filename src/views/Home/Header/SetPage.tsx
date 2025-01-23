
import { useState } from 'react'
import type { MenuProps } from 'antd';
import { Dropdown, Segmented, Flex } from 'antd';
import { SettingPage } from './style'

const Options = [
  { label: '默认', value: 0, va: '$0.10322' },
  { label: '高速', value: 1, va: '$0.20674' },
  { label: '极速', value: 2, va: '$0.41348' },
]

function SettingConfig() {
  const [gasPrice, setGasPrice] = useState(0)
  const segmChange = (e) => {
    setGasPrice(Number(e))
  }
  return (
    <SettingPage>
      <div className='ht'>启用优先费用功能</div>
      <div className='mt-3 mb-3'>通过调整您在SlerfTools上的上链优先费用，优先处理您的交易，从而规避Solana网络拥堵时可能出现的交易失败。</div>
      <div>
        <Segmented options={Options} size='large' value={gasPrice} onChange={segmChange} />
        <div className='showvalue mt-2'>
          <div style={{ color: "#ff5042" }}>{Options[gasPrice].va}</div>
          <div style={{ color: "#ffbc00" }}>{Options[gasPrice].va}</div>
          <div style={{ color: "#23c333" }}>{Options[gasPrice].va}</div>
        </div>
      </div>
      <div className='hint'>考虑到优先费用常有助于将交易发送到网络，但其有效性取决于网络的当前状态</div>

      <div className='rpc'>RPC端点</div>
      
    </SettingPage>
  )
}

export default SettingConfig