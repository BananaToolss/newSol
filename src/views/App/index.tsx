import { Flex, Button } from "antd"
import Card from "./Card"
import ToolPageApp from './ToolPage'
import { TELEGRAMLINK } from "@/config"
import { getImage } from '@/utils'
import {
  AppPage,
  ToolPage
} from './style'


function App() {
  return (
    <AppPage>
      <div className="header bg">
        <div className="mb20">
          <h1 className="burn">BalanaTools | 一键发币、靓号合约工具、批量空投、和做市机器人、抢跑机器人等工具。</h1>
          <h2>在任何网络上快速创建代币，创建NFT，不需要任何代码基础轻松拥有属于您自己的代币或NFT。</h2>
        </div>
        <h3>本平台拥有: 批量转账、批量归集、做市机器人、抢跑机器人，助您轻松打造成功项目。</h3>

        <div className="title2 mb20">
          <a href="/#/token/Standard" title="一键发币，创建代币">
            <Button type="primary" size='large'>创建代币</Button>
          </a>
        </div>

        <div className="title2" style={{ margin: '40px 0 30px' }}>
          <div>我们提供多种选项，因此我们的所有代币都包含一组标准功能。</div>
          <div>所有这些功能都包含在我们的所有代币中，无需额外费用，因此您可以放心，助力项目快速启动。</div>
        </div>
      </div>

      <Card />

      <ToolPageApp />

      <ToolPage>
        <Flex justify="center" className="header">
          <img src={getImage('star.png')} alt="代币定制开发" />
          <strong className="title3 ml20">需要代币定制开发吗？</strong>
        </Flex>
        <Flex justify="center" className="footerItem">
    
          <div className="btn2">
            <a href={TELEGRAMLINK} target="_blank" title="联系我们">
              <Button type="primary" size='large'>联系我们</Button>
            </a>
          </div>
        </Flex>
      </ToolPage>

      <footer>
         <p>@balanaTools一键发币平台</p>
         <a href="https://t.me/BananaTools" target="_blank" title="联系我们">联系我们</a>
      </footer>

    </AppPage>
  )
}

export default App