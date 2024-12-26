import styled from "styled-components";

export const WalletInfoPage = styled.div`
  margin: 20px 0;
  .header {
    margin: 10px 0;
  }
  
  .wallet {
    font-size: 14px;
  }
  .walletHeader {
    display: flex;
    justify-content: space-between;
    margin: 10px 0 0 0;
    border: 1px solid #e2e8f0;
    background-color: #fafafa;
    font-weight: bold;
    border-radius: 10px 10px 0 0;

    div {
      width: 25%;
      text-align: center;
      padding: 10px 0;
    }
    div:not(:last-child) {
      border-right: 1px solid #e2e8f0;
    }
  }

  .walletInfo {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;
    div {
      width: 25%;
      text-align: center;
      padding: 10px 0;
    }
    div:not(:last-child) {
      border-right: 1px solid #e2e8f0;
    }
  }
`