import { useState } from 'react'
import { BsExclamationCircleFill, BsCheckCircleFill, BsXLg } from "react-icons/bs";
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
  margin: 10px 0;

  .item {
    display: flex;
    align-items: center;
  }
  .svg {
    width: 20px;
    height: 20px;
    svg {
    width: 16px !important;
    height: 16px !important;
    }
  }
  .pointer {
    width: 26px;
    height: 26px;
    margin-left: 6px;
  }
`

interface PropsType {
  title: string
  showClose?: boolean
}

function Hint(props: PropsType) {

  const { title, showClose } = props

  const [isClose, setIsClose] = useState(false)

  return (
    <div className={isClose ? 'hidden' : ''}>
      <HintPage>
        <div className='item'>
          <div className='svg'>
            <BsExclamationCircleFill color='#faad14' />
          </div>
          <div className='ml-2'>{title}</div>
        </div>
        {showClose && <BsXLg className='pointer' onClick={() => setIsClose(true)} />}
      </HintPage>
    </div>
  )
}

export default Hint