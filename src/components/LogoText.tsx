import styled from "styled-components"
import { PROJECT_NAME } from '@/config'
import { getImage } from '@/utils'

const Logo = styled.div`
  display: flex;
  /* justify-content: center; */
  align-items: center;
  padding: 10px 4px;
  border-bottom: 1px solid #59595987;

  img {
    width: 50px;
    /* height: 44px; */
  }
  .text {
    font-size: 20px;
    font-weight: bold;
    margin-left: 6px;
    color: #000;
  }
`

export default function LogoText() {
  return (
    <Logo>
      <img src={getImage('logo.png')} alt='logo' />
      <div className="text">{PROJECT_NAME}</div>
    </Logo>
  )
}
