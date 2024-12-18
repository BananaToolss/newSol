import { Text_Style } from '@/config'
import styled from 'styled-components'

const HeaderS = styled.div`
  .hint {
    font-size: 14px;
    color: #706c6c;
    margin-top: 4px;
  }
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e2e2;
`

interface PropsType {
  title: string
  hint?: string
}

function Header(props: PropsType) {
  const { title, hint } = props

  return (
    <HeaderS>
      <h1 className={Text_Style}>{title}</h1>
      <p className='hint'>{hint}</p>
    </HeaderS>
  )
}

export default Header