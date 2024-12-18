import React, { useState } from 'react'
import { Button } from 'antd'
import { Input_Style, Button_Style, Text_Style, Text_Style1 } from '@/config'
import {
  VanityPage
} from './style'

function Vanity() {
  const [iscreating, setIsCreating] = useState(false)
  const createVanity = async () => {

  }

  return (
    <VanityPage>
      <div className='left page'>
        <div className='flexitem'>
          <div className='item'>
            <div className='mb-1'>前缀</div>
            <input
              type="text"
              className={`${Input_Style} text-base`}
              placeholder='请输入前缀'
              name='name'
            />
          </div>
          <div className='item'>
            <div className='mb-1'>后缀</div>
            <input
              type="text"
              className={`${Input_Style} text-base`}
              placeholder='请输入后缀'
              name='name'
            />
          </div>
        </div>

        <div className='mt-6'>
          <div className='mb-1'>线程数(根据自身设备性能调整)</div>
          <input
            type="text"
            className={`${Input_Style} text-base`}
            placeholder='请输入线程数'
            name='name'
          />
        </div>

        <div className='button'>
          <Button className='btn1'
            onClick={createVanity} loading={iscreating}>
            <span>暂停</span>
          </Button>
          <Button className='btn2'
            onClick={createVanity} loading={iscreating}>
            <span>生成</span>
          </Button>
        </div>
      </div>

      <div className='right page'>
        <div>生成信息</div>
        <div className='ritem'>
          <div className='ritem_item'>
            <div>难度</div>
            <div>1</div>
          </div>
          <div className='ritem_item'>
            <div>已生成</div>
            <div>1</div>
          </div>
          <div className='ritem_item'>
            <div>预估时间</div>
            <div>1</div>
          </div>
          <div className='ritem_item'>
            <div>速度</div>
            <div>1</div>
          </div>
          <div className='ritem_item'>
            <div>状态</div>
            <div>1</div>
          </div>
        </div>
      </div>
    </VanityPage>
  )
}

export default Vanity