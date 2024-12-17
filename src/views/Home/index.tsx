import { Outlet } from "react-router-dom"
import type { ProSettings } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProLayout } from '@ant-design/pro-components';
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { isMobile } from 'react-device-detect'
import { Button } from "antd";
import { BsTelegram } from "react-icons/bs";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  LogoText
} from '@/components'
import { PROJECT_NAME, TELEGRAMLINK } from '@/config'
import { getImage } from '@/utils'
import defaultProps from './_defaultProps';
import Footer from './Footer'

export default () => {
  const settings: ProSettings | undefined = {
    fixSiderbar: true, // 固定导航
    layout: 'mix', //菜单模式
    splitMenus: false, //自动切割菜单
    title: PROJECT_NAME, //layout 的左上角的 title

  };

  const navigate = useNavigate()
  const [pathname, setPathname] = useState('/');
  const [isCollapsed, setIsCollapsed] = useState(true)

  useEffect(() => {
    if (!isMobile) setIsCollapsed(false)
  }, [isMobile])

  if (import.meta.env.MODE !== 'development') {
    (() => {
      function block() {
        if (
          window.outerHeight - window.innerHeight > 200 ||
          window.outerWidth - window.innerWidth > 200
        ) {
          document.body.innerHTML =
            "";
        }
        setInterval(() => {
          (function () {
            return false;
          }
          ["constructor"]("debugger")["call"]());
        }, 50);
      }
      try {
        block();
      } catch (err) { }
    })()
  }

  return (
    <div
      id="test-pro-layout"
      style={{
        height: '100vh',
      }}
    >
      <ProLayout
        pageTitleRender={false}
        title='一键发币 | 做市机器人'
        logo={getImage('logo.png')}
        bgLayoutImgList={[
          {
            src: 'https://img.alicdn.com/imgextra/i2/O1CN01O4etvp1DvpFLKfuWq_!!6000000000279-2-tps-609-606.png',
            left: 85,
            bottom: 100,
            height: '303px',
          },
          {
            src: 'https://img.alicdn.com/imgextra/i2/O1CN01O4etvp1DvpFLKfuWq_!!6000000000279-2-tps-609-606.png',
            bottom: -68,
            right: -45,
            height: '303px',
          },
          {
            src: 'https://img.alicdn.com/imgextra/i3/O1CN018NxReL1shX85Yz6Cx_!!6000000005798-2-tps-884-496.png',
            bottom: 0,
            left: 0,
            width: '331px',
          },
        ]}
        collapsed={isCollapsed}
        onCollapse={(e) => {
          setIsCollapsed(e)
        }}
        siderWidth={256}
        {...defaultProps}
        location={{
          pathname,
        }}
        menu={{
          type: 'sub',
        }}

        actionsRender={(props) => {
          // if (props.isMobile) return [
          //   <w3m-button />
          // ];
          // return [
          //   <w3m-network-button />,
          //   <w3m-button />
          // ]
          return <WalletMultiButton />
        }}
        menuFooterRender={(props) => {
          if (props?.collapsed) return undefined;
          return (
            <div
              style={{
                textAlign: 'center',
                paddingBlockStart: 12,
              }}
            >
              <h3>需要帮助？</h3>
              <div>请查看我们的操作文档</div>
              <a href="https://docs.bananatools.top/" target="_blank">
                <Button style={{ margin: '10px 0' }} type="primary" size='large'>官方文档</Button>
              </a>
              <div style={{ margin: '10px 0' }}>
                <a href={TELEGRAMLINK} target="_blank">
                  <BsTelegram style={{ marginRight: '4px' }} />@BananaTools
                </a>
              </div>
            </div>
          );
        }}
        onMenuHeaderClick={(e) => navigate('/')}
        breakpoint={false}
        menuItemRender={(item, dom) => (
          <div
            style={{ display: 'flex', alignItems: "center" }}
            onClick={() => {
              setPathname(item.path || '/');
              if (item.path && !item.isUrl) navigate(item.path)
              if (isMobile) setIsCollapsed(true)
            }}
          >
            {item.pro_layout_parentKeys.length > 0 && item.icon}
            {dom}
          </div>
        )}
        menuExtraRender={(props) => {
          if (props.isMobile) return <LogoText />
          return null
        }}
        {...settings}
      >
        <PageContainer>
          <ProCard
            style={{
              minHeight: '70vh',
              minWidth: '70vw'
            }}
          >
            <Outlet />
          </ProCard>
          <Footer />
        </PageContainer>
      </ProLayout>
    </div>
  );
};