import styled from 'styled-components'
import { getImage } from '@/utils'

export const CardSwapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 80px;
  /* align-items: center; */

  .carditem {
    width: 30%;
    /* border: 1px solid red; */
  }

  @media screen and (max-width:968px) { 
  .carditem {
    width: 48%;
  }
  }
`
const CardItem = styled.div`
  margin-bottom: 30px;
  /* border: 1px solid red; */
  .t1 {
    margin: 20px 0 10px;
  }
  .t2 {
    margin-bottom: 20px;
  }
`

interface CardType {
  img: any
  title: string
  title1: string
  title2: string
}

const CardPage = () => {
  const config: CardType[] = [
    {
      img: getImage('c1.png'), title: '符合规格', title1: '适用于每个钱包和交易所。',
      title2: '我们所有的代币都经过严格的测试，以确保它们完全符合标准。',
    },
    {
      img: getImage('c2.png'), title: '已审核', title1: '经过最好的测试。',
      title2: '我们所有的代币都经过审核，以确保遵循最佳安全实践和标准。',
    },
    {
      img: getImage('c3.png'), title: '正式验证', title1: '最高的安全标准。',
      title2: '我们所有的代币都经过正式的验证流程，以确保它们安全可靠。',
    },
    {
      img: getImage('c4.png'), title: '源代码已验证', title1: '完成之前已验证。',
      title2: '我们所有的代币都在所有主要区块浏览器上进行了预先验证，它们立即显示为已验证。',
    },
    {
      img: getImage('c5.png'), title: '高级访问控制', title1: '您是唯一有权访问的人。',
      title2: '我们的代币具有高级访问控制功能，确保只有您才能访问所有代币功能。',
    },
    {
      img: getImage('c6.png'), title: '信任与信心', title1: '完美的记录。',
      title2: '我们创建代币已经超过 5 年了，我们的代币被成千上万的人使用。无与伦比的记录。',
    },
  ]

  return (
    <CardSwapper>
      {config.map(item => (
        <Card {...item} key={item.title} />
      ))}
    </CardSwapper>
  )
}

function Card(props: CardType) {
  const { img, title, title1, title2 } = props
  return (
    <CardItem className='carditem'>
      <img src={img} width={60} alt='安全代币合约'/>
      <div className='t1'>{title}</div>
      <div className='title2 t2'>{title1}</div>
      <div className='hitcolor'>{title2}</div>
    </CardItem>
  )
}

export default CardPage