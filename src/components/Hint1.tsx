import { useState } from 'react'
import { BsExclamationCircleFill, BsCheckCircleFill, BsXLg } from "react-icons/bs";
import styled from 'styled-components';

const HintPage = styled.div`
  border: 1px solid #52c41a;
  background-color: #f6ffed;
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

interface PropsType {
  title: string
  showClose?: boolean
}

function Hint(props: PropsType) {

  const { title,  showClose } = props

  const [isClose, setIsClose] = useState(false)

  return (
    <div className={isClose ? 'hidden' : ''}>
      <HintPage>
        <div className='item'>
          <BsCheckCircleFill color='#52c41a' />
          <div className='ml-2'>{title}</div>
        </div>
        {showClose && <BsXLg className='pointer' onClick={() => setIsClose(true)} />}
      </HintPage>
    </div>
  )
}

export default Hint