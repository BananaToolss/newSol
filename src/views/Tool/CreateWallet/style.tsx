import styled from 'styled-components'

export const CreateWalletPage = styled.div`
   margin-top: 50px;

  .wallets {
    display: flex;
    text-align: center;
    cursor: pointer;
    
    .wallets_left {
      width: 40%;
      padding: 10px;
    }
    .wallets_right {
      width: 60%;
      padding: 10px;
    }
  }
  .wallet_bt {
   border-top: 1px solid #d1d5db;
  }
  .wallet_bb {
   border-bottom: 1px solid #d1d5db;
  }

  .wallets_box {
    height: 380px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    word-break:break-all;
    overflow-y: scroll;
  }
`
