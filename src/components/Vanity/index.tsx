import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Button, message } from 'antd'
import { BsCopy } from "react-icons/bs";
import copy from 'copy-to-clipboard';
import { Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Input_Style } from '@/config'
import {
  VanityPage
} from './style'

interface Props {
  callBack: (secretKey: Uint8Array) => void
}

function Vanity(props: Props) {
  const { callBack } = props

  const [messageApi, contextHolder] = message.useMessage();
  const [runConfig, setRunConfig] = useState({
    isForward: false,
    isBack: false,
    isInclude: false,
    forward: '',
    back: '',
    include: '',
    thread: '4'
  })
  const [isStartRun, setIsStartRun] = useState(false)
  const [runTime, setRunTime] = useState(0)
  const [runCount, setRunCount] = useState({ index: 0, count: 0 })
  const [runCountArr, setRunCountArr] = useState([])
  const [runCountTotal, setRunCountTotal] = useState(0)
  const [runSpeed, setRunSpeed] = useState(0)
  const workerRef = useRef([])
  const runTimeRef = useRef(null)
  const [tokenAddr, setTokenAddr] = useState('')

  useEffect(() => {
    if (runCount.count > 0) {
      const _runCountArr = [...runCountArr]
      _runCountArr[runCount.index] = runCount.count
      setRunCountArr(_runCountArr)
    }
  }, [runCount])
  useEffect(() => {
    if (runCountArr.length > 0) {
      let total = 0
      runCountArr.forEach(item => {
        if (item) total += item
      })
      setRunCountTotal(total)
    }
  }, [runCountArr])
  useEffect(() => {
    if (runCountTotal) {
      const _time = runTime ? runTime : 1
      setRunSpeed(Number((runCountTotal / _time).toFixed(0)))
    }
  }, [runCountTotal, runTime])

  const runConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const _config = { ...runConfig }
    if (e.target.name === 'forward') {
      e.target.value ? _config.isForward = true : _config.isForward = false
    }
    if (e.target.name === 'back') {
      e.target.value ? _config.isBack = true : _config.isBack = false
    }
    _config[e.target.name] = e.target.value
    setRunConfig(_config)
  }

  const init = () => {
    setRunTime(0)
    setIsStartRun(true)
    setRunCountArr([])
    setRunCountTotal(0)
    setRunSpeed(0)
    setTokenAddr('')

    if (runTimeRef.current) clearInterval(runTimeRef.current)
    runTimeRef.current = setInterval(() => {
      setRunTime(item => item + 1)
    }, 1000)
  }

  //开始跑靓号
  const startRun = () => {
    console.log('开始扫描')
    init()

    const url = `${window.location.origin}/worker.js`

    for (let index = 0; index < Number(runConfig.thread); index++) {
      workerRef.current[index] = new Worker(url, { name: `${index}` })
      workerRef.current[index].postMessage({
        runConfig,
        index,
      })
      workerRef.current[index].onmessage = function (e: any) {
        const { key, state, content } = e.data

        if (state === 'Succese') {
          setIsStartRun(false)
          stopRun()
          setTokenAddr(Keypair.fromSecretKey(key).publicKey.toBase58())
          callBack(key)
          messageApi.success('扫描成功')
        } else {
          setRunCount(content)
        }
      }
    }
  }

  const stopRun = () => {
    workerRef.current.forEach(item => {
      item.terminate()
    })
    setIsStartRun(false)
    if (runTimeRef.current) clearInterval(runTimeRef.current)
  }

  const getRunDifficulty = useMemo(() => {
    let length = 0
    if (runConfig.isForward) length += runConfig.forward.length
    if (runConfig.isBack) length += runConfig.back.length
    if (runConfig.isInclude) length += runConfig.include.length
    return 16 ** length
  }, [runConfig])

  const copyClick = () => {
    copy(tokenAddr)
    messageApi.success('copy success')
  }

  return (
    <VanityPage>
      {contextHolder}
      <div className='left page'>
        <div className='flexitem'>
          <div className='item'>
            <div className='mb-1'>前缀</div>
            <input
              type="text"
              className={`${Input_Style} text-base`}
              placeholder='请输入前缀'
              value={runConfig.forward}
              onChange={runConfigChange}
              name='forward'
            />
          </div>
          <div className='item'>
            <div className='mb-1'>后缀</div>
            <input
              type="text"
              className={`${Input_Style} text-base`}
              placeholder='请输入后缀'
              value={runConfig.back}
              onChange={runConfigChange}
              name='back'
            />
          </div>
        </div>

        <div className='mt-6'>
          <div className='mb-1'>线程数(根据自身设备性能调整)</div>
          <input
            type="text"
            className={`${Input_Style} text-base`}
            placeholder='请输入线程数'
            value={runConfig.thread}
            onChange={runConfigChange}
            name='thread'
          />
        </div>

        <div className='button'>
          <Button className='btn1'
            onClick={stopRun}>
            <span>暂停</span>
          </Button>
          <Button className='btn2'
            onClick={startRun} loading={isStartRun}>
            <span>生成</span>
          </Button>
        </div>
      </div>

      <div className='right page'>
        <div>生成信息</div>
        <div className='ritem'>
          <div className='ritem_item'>
            <div>难度</div>
            <div>{getRunDifficulty}</div>
          </div>
          <div className='ritem_item'>
            <div>已生成地址数量</div>
            <div>{runCountTotal}</div>
          </div>
          <div className='ritem_item'>
            <div>扫描速度</div>
            <div>{runSpeed}/秒</div>
          </div>
          <div className='ritem_item'>
            <div>已运行</div>
            {runTime === 0 ?
              <div className="tb2">等待</div> :
              (runTime > 0 && runSpeed < 2) ?
                <div className="tb2">初始化中...</div> :
                <div className="tb2">{`${runTime}秒`}</div>
            }
          </div>
        </div>
      </div>
    </VanityPage>
  )
}

export default Vanity