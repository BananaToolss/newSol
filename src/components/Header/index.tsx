import styled from 'styled-components'
import { Text_Style } from '@/config'

const HeaderS = styled.header`
  .hint {
    font-size: 14px;
    color: #706c6c;
    margin-top: 4px;
  }
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e2e2;
  /* text-transform: uppercase; */
  margin-bottom: 50px;
`

interface PropsType {
  title: string
  hint?: string
}

function Header(props: PropsType) {
  const { title, hint } = props

  return (
    <HeaderS>
      <h1 className={`${Text_Style} text-4xl`}>{title}</h1>
      <h2 className='hint'>{hint}</h2>
    </HeaderS>
  )
}

export default Header