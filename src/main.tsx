import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter } from "react-router-dom"
import Web3Modal from './utils/wagmi'
import { store } from './store'
import { StoreProvider } from "./StoreProvider";
import './assets/locals'; // 引入i18n配置
import Routers from './router'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <HashRouter>
      <StoreProvider>
        <Web3Modal>
          <Routers />
        </Web3Modal>
      </StoreProvider>
    </HashRouter>
  </Provider>
)
