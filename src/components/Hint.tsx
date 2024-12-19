import { useState } from 'react'
import { BsExclamationCircleFill, BsX, BsXLg } from "react-icons/bs";
import styled from 'styled-components';

const HintPage = styled.div`
  border: 1px solid #ff9815;
  background-color: #fffbf6;
  border-radius: 6px;
  padding: 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .item {
    display: flex;
    align-items: center;
  }
`

function Hint() {
  const [isClose, setIsClose] = useState(false)

  return (
    <div className={isClose ? 'hidden' : ''}>
      <HintPage>
        <div className='item'>
          <BsExclamationCircleFill color='#faad14' />
          <div className='ml-2'>创建代币过程受本地网络环境影响较大。如果持续失败，请尝试切换到更稳定的网络或开启VPN全局模式后再进行操作</div>
        </div>
        <BsXLg className='pointer' onClick={() => setIsClose(true)} />
      </HintPage>
    </div>
  )
}

export default Hint