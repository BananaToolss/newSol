import { SetStateAction, Dispatch } from 'react'
import { getImage } from '@/utils'
import {
  SegmentdPage
} from './style'

interface PropsType {
  count: number
  setCount: Dispatch<SetStateAction<number>>
}

function Segmentd(props: PropsType) {
  const { count, setCount } = props



  return (
    <SegmentdPage>
      <div className={`flex items-center item ${count === 1 && 'active'}`}
        onClick={() => setCount(1)}>
        <img src={getImage('raydium.png')} />
        <div>Raydium</div>
      </div>
      <div className={`flex items-center item ${count === 2 && 'active'}`}
        onClick={() => setCount(2)}>
        <img src={getImage('pump.png')} />
        <div>PumpFun</div>
      </div>
    </SegmentdPage>
  )
}

export default Segmentd