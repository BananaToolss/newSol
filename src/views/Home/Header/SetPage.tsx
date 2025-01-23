
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Dropdown, Segmented, Radio, Input, Button } from 'antd';
import { rpcUrl, isMainnet } from '@/store/countterSlice'
import { rpcUrlChange, isMainnetChange } from '@/store/countterSlice';
import { SettingPage } from './style'

const Options = [
  { label: '默认', value: 0, va: '$0.10322' },
  { label: '高速', value: 1, va: '$0.20674' },
  { label: '极速', value: 2, va: '$0.41348' },
]

const MAINCONFIG = [{
  label: '通用地区',
  value: "https://vivianne-g1n6x7-fast-mainnet.helius-rpc.com/",
  time: '',
  color: '',
},
{
  label: '🇳🇱阿姆斯特丹',
  value: "https://mainnet.helius-rpc.com/?api-key=1ebd5af0-f37c-4aaa-861e-2d8f5e656516",
  time: '',
  color: '',
},
{
  label: '通用地区',
  value: "https://helius-rpc.slerf.tools/",
  time: '',
  color: '',
},
{
  label: '通用地区',
  value: "https://mainnet.helius-rpc.com/?api-key=812db19f-55d0-417a-8e7e-0ade8df22075",
  time: '',
  color: '',
}]

function SettingConfig() {
  const disPatch = useDispatch()
  const _rpcUrl = useSelector(rpcUrl)
  const isMain = useSelector(isMainnet)
  const [gasPrice, setGasPrice] = useState(0)
  const [rpcOptions, setRpcOptions] = useState(MAINCONFIG)
  const [addRpc, setAddRpc] = useState('')

  useEffect(() => {
    getAllTime()
  }, [_rpcUrl])

  const segmChange = (e) => {
    setGasPrice(Number(e))
  }
  const isMainChange = (e) => {
    if (isMain) { //dev
      disPatch(rpcUrlChange('https://devnet.helius-rpc.com/?api-key=812db19f-55d0-417a-8e7e-0ade8df22075'))
    }
    disPatch(isMainnetChange(!isMain))
  }

  const getUrlTime = (url: string) => {
    return new Promise(async (resolve: (value: number) => void, reject) => {
      try {
        const start = Date.now();
        await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        const latency = Date.now() - start;
        resolve(latency)
      } catch (error) {
        reject(error)
      }
    })
  }

  const getAllTime = async () => {
    try {
      const times = []
      const resolvers = rpcOptions.map(async (item) => {
        try {
          const time = await getUrlTime(item.value)
          times.push(time)
        } catch (error) {
          times.push('err')
        }
      })
      await Promise.all(resolvers)
      const _rpcOptions = [...rpcOptions]
      _rpcOptions.map((item, index) => {
        item.time = times[index]
        item.color = Number(times[index]) < 100 ? '#1fa751' : Number(times[index]) < 1000 ? '#ca8a04' : '#f15555'
      })
      setRpcOptions(_rpcOptions)
    } catch (error) {
      console.log(error, 'error')
    }
  }

  const RadioChange = (item) => {
    disPatch(rpcUrlChange(item.value))
  }

  const AddRpcClick = () => {
    setRpcOptions([...rpcOptions, {
      label: '通用地区',
      value: addRpc,
      time: '',
      color: '',
    }])
    disPatch(rpcUrlChange(addRpc))
  }

  return (
    <SettingPage>
      <div className='ht'>启用优先费用功能</div>
      <div className='mt-3 mb-3'>通过调整您在SlerfTools上的上链优先费用，优先处理您的交易，从而规避Solana网络拥堵时可能出现的交易失败。</div>
      <div>
        <Segmented options={Options} size='large' value={gasPrice} onChange={segmChange} />
        <div className='showvalue mt-2'>
          <div style={{ color: "#ff5042" }}>{Options[0].va}</div>
          <div style={{ color: "#ffbc00" }}>{Options[1].va}</div>
          <div style={{ color: "#23c333" }}>{Options[2].va}</div>
        </div>
      </div>
      <div className='hint'>考虑到优先费用常有助于将交易发送到网络，但其有效性取决于网络的当前状态</div>

      <div className='rpc'>RPC端点</div>
      <div className='mt-4 mb-6'>
        {rpcOptions.map((item, index) => (
          <div className='net' key={index}>
            <div className='flex'>
              <Radio checked={item.value === _rpcUrl} onChange={() => RadioChange(item)} />
              <div>端点{index + 1}</div>
            </div>
            <div style={{ color: item.color }} className='flex'>
              <div className='ml-1 mr-1'>•</div>
              {item.time}ms
            </div>
          </div>
        ))}

      </div>

      <div>
        <Input placeholder='自定义节点URL' value={addRpc} onChange={(e) => setAddRpc(e.target.value)}
          addonAfter={<div onClick={AddRpcClick}>确认</div>} />
      </div>

      <div className='rpc mb-3'>网络选择</div>
      <div className='flex'>
        <div className='mr-6'><Radio checked={isMain} onChange={isMainChange} />主网</div>
        <div><Radio checked={!isMain} onChange={isMainChange} />测试网</div>
      </div>
    </SettingPage>
  )
}

export default SettingConfig