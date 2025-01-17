import { Flex, Button } from "antd"
import styled from "styled-components"
import { BsDatabase, BsSend, BsCollection, BsCoin, BsFileImage } from "react-icons/bs";
import { getImage } from '@/utils'
import {
  ToolPage
} from './style'

const CardSwapper = styled.div`
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`
const Card = styled.div`
   border: 1px solid #dee2e6;
   width: 24%;
   padding: 10px 20px;
   border-radius: 6px;
   margin-bottom: 20px;

   .t1 {
    margin: 20px 0 10px;
    svg {
      width: 40px;
      height: 40px;
      color: #2563eb;
    }
   }
   .t2 {
    font-size: 20px;
   }
   .t3 {
    margin: 10px 0 30px;
   }
   .buttonSwapper {
    button {
      width: 100%;
      border-radius: 20px;
      background: linear-gradient(116deg,  #6253E1, #04BEFE) !important;
    }
   }

   &:hover {
    box-shadow: 0 5px 10px -4px rgba(34, 23, 11, .2);
    .t2 {
      color: #1677ff;
    }
   }

   @media screen and (max-width:968px) { 
    width: 100%;
   }
`

function ToolPageApp() {
  return (
    <ToolPage>
      <Flex justify="center" className="header">
        <img src={getImage('tool.png')} alt="一键发币，一键NFT，代币空投，代币归集" />
        <div className="title3 ml20">Solanan链代币工具</div>
      </Flex>

      <CardSwapper>

        <Card>
          <div className="t1 text-center">
            <BsCoin />
          </div>
          <strong className="t2">创建SPL代币</strong>
          <div className="t3 hitcolor">快速发行代币，简单、便宜，构建自己的Solana代币</div>
          <div className="buttonSwapper">
            <a href="/#/token/create" title="创建代币">
              <Button type="primary" size='large'>创建代币</Button>
            </a>
          </div>
        </Card>

        <Card>
          <div className="t1">
            <BsFileImage />
          </div>
          <strong className="t2">PumpFun开盘</strong>
          <div className="t3 hitcolor">Pump.fun开盘时，其他地址同时进行代币买入操作，快人一步</div>
          <div className="buttonSwapper">
            <a href="/#/pump/create" title="创建NFT">
              <Button type="primary" size='large'>PumpFun开盘</Button>
            </a>
          </div>
        </Card>

        <Card>
          <div className="t1">
            <BsSend />
          </div>
          <strong className="t2">批量转账</strong>
          <div className="t3 hitcolor">Solana链上最好用的空投工具，批量发送代币</div>
          <div className="buttonSwapper">
            <a href="/#/tool/multisend" title="批量转账">
              <Button type="primary" size='large'>批量转账</Button>
            </a>
          </div>
        </Card>

        <Card>
          <div className="t1">
            <BsCollection />
          </div>
          <strong className="t2">批量归集</strong>
          <div className="t3 hitcolor">多钱包归集到主钱包，速度快、节省GAS费用</div>
          <div className="buttonSwapper">
            <a href="/#/tool/collector" title="批量归集">
              <Button type="primary" size='large'>批量归集</Button>
            </a>
          </div>
        </Card>
      </CardSwapper>
    </ToolPage>
  )
}

export default ToolPageApp