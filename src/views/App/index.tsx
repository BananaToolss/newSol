import { Flex, Button } from "antd"
import Card from "./Card"
import ToolPageApp from './ToolPage'
import { TELEGRAMLINK, Text_Style } from "@/config"
import { getImage } from '@/utils'
import {
  AppPage,
  ToolPage
} from './style'


function App() {
  return (
    <AppPage>
      <div className="header bg ">
        <div className="mb20">
          <h1 className={`text-5xl font-bold ${Text_Style} mb-3`}>构建自己的Solana代币</h1>
          <h1 className={`text-4xl font-bold ${Text_Style}`}>Solana链一键发币平台，</h1>
        </div>
        <h3 className={`text-2xl font-bold mb-4 text-start`}>一键发行Solana代币的平台，BananaTools是一个为Solanan链设计的一键发币平台，让你能轻松发行自己的SOL代币</h3>
        <h3 className={`text-2xl font-bold mb-4 text-start`}>PumpFun创建代币并买入：在 Pump.fun 开盘时，其他地址同时进行代币买入操作，有效简化交易流程并加速市场参与，快人一步，抢得先机，从而更早获得潜在的收益。</h3>


        <div className="title2 mb20">
          <a href="/#/token/create" title="Solana一键发币，Solana代币">
            <Button type="primary" size='large'>创建代币</Button>
          </a>
        </div>

        {/* <div className="title2" style={{ margin: '40px 0 30px' }}>
          <div>我们提供多种选项，因此我们的所有代币都包含一组标准功能。</div>
          <div>所有这些功能都包含在我们的所有代币中，无需额外费用，因此您可以放心，助力项目快速启动。</div>
        </div> */}
      </div>

      {/* <Card /> */}

      <ToolPageApp />

      {/* <ToolPage>
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
      </ToolPage> */}

      <footer>
        <p>@balanaTools一键发币平台</p>
        <a href="https://t.me/BananaTools" target="_blank" title="联系我们">联系我们</a>
      </footer>

    </AppPage>
  )
}

export default App