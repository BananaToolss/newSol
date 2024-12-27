import { useEffect, useState } from 'react'
import { message, Segmented, Button, Input, Select, notification } from 'antd';
import { JitoPage } from './style'

const JITOFEEARR = [
  { label: '默认0.00003', value: 0.00003 },
  { label: '快速0.001', value: 0.001 },
  { label: '极速0.01', value: 0.01 },
]

const { Option } = Select

function JitoFee() {

  const [transferType, setTransferType] = useState<string>(JITOFEEARR[0].label);
  const [jitoFee, setJitoFee] = useState(JITOFEEARR[0].value)

  const [rpcOptions, setRpcOptions] = useState([
    {
      label: '通用地区',
      value: "https://mainnet.block-engine.jito.wtf",
      time: '',
      color: '',
    },
    {
      label: '🇳🇱阿姆斯特丹',
      value: "https://amsterdam.mainnet.block-engine.jito.wtf",
      time: '',
      color: '',
    },
    {
      label: '🇩🇪法兰克福',
      value: "https://frankfurt.mainnet.block-engine.jito.wtf",
      time: '',
      color: '',
    },
    {
      label: '🇺🇸纽约',
      value: "https://ny.mainnet.block-engine.jito.wtf",
      time: '',
      color: '',
    },
    {
      label: '🇯🇵东京',
      value: "https://tokyo.mainnet.block-engine.jito.wtf",
      time: '',
      color: '',
    },
    {
      label: '🇺🇸盐湖城',
      value: "https://slc.mainnet.block-engine.jito.wtf",
      time: '',
      color: '',
    },
  ])

  useEffect(() => {
    getAllTime()
  }, [])

  const transferTypeChange = (e: string) => {
    setTransferType(e)
    const jito = JITOFEEARR.filter(item => item.label === e)
    setJitoFee(jito[0].value)
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
        item.color = Number(times[index]) > 1000 ? '#f15555' : Number(times[index]) > 100 ? '#ca8a04' : '#1fa751'
      })
      setRpcOptions(_rpcOptions)
    } catch (error) {
      console.log(error, 'error')
    }
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


  return (
    <JitoPage>
      <div className='flex items-center segmentd'>
        <div className='text-sm'>Jito捆绑小费：</div>
        <Segmented options={[JITOFEEARR[0].label, JITOFEEARR[1].label, JITOFEEARR[2].label]}
          value={transferType} onChange={transferTypeChange}
          size='large' />
        <div className='ml-2 flex items-center'>
          <Input value={jitoFee} onChange={(e) => setJitoFee(Number(e.target.value))} />
          <div className='text-sm ml-1'>SOL</div>
        </div>
      </div>

      <div className='flex items-center mt-5'>
        <div className='text-sm mr-6'>Jito服务器:</div>
        <Select style={{ width: '300px' }} defaultValue={rpcOptions[0].value}>
          {rpcOptions.map((item, index) => (
            <Option value={item.value} key={index}>
              <div className='flex'>
                <div>{item.label}</div>
                <div className='ml-1 mr-1'>••••••</div>
                <div style={{ color: item.color }}>{item.time}ms</div>
              </div>
            </Option>
          ))}
        </Select>
      </div>
    </JitoPage>


  )
}

export default JitoFee