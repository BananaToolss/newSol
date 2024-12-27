import styled from "styled-components";

export const SwapBot = styled.div`

  button {
    background-color: #63e2bd;
  }
 .swappage {
  width: 50%;
  margin: 100px auto;
}

.segmentd {
    margin-top: 30px;
    text-align: center;
    
    .ant-segmented.ant-segmented-lg {
      width: 100%;
    }
    .ant-segmented-item {
      width: 50%;
    }
  }
  .ant-segmented.ant-segmented-lg .ant-segmented-item-label {
    min-height: 48px;
    line-height: 48px;
    font-weight: bold;
  }
  .ant-segmented .ant-segmented-item-selected  {
    background-color: #63e2bd;
    color: #fff;
  }
  .swap_wallet {
    max-height: 300px;
    overflow-y: scroll;
    margin-bottom: 50px;
    word-break:break-all;
    svg {
      fill: red;
    }
  }
  .wallet_item {
    border-bottom: 1px solid #d6d0d0;
    padding: 10px 0;
  }

  .swap_box {
    border: 1px solid #d6d0d0;
    border-radius: 10px;
    padding: 0 12px;
    height: 60px;
    cursor: pointer;
  }

  .swap_w {
    width: 46%;
  }

  .swap_btn {
    border: 1px solid #d6d0d0;
    border-radius: 6px;
    height: 45px;
    display: flex;
    align-items: center;
    padding: 0 6px;
    cursor: pointer;
  }

  .btnActive {
    background: #63e2bd;
    color: #fff;
  }

  .logswapper {
    border: 1px solid #d6d0d0;
    border-radius: 6px;
    padding: 6px;
    height: 500px;
    overflow-y: scroll;
    font-size: 14px;
    .logs_time {
      /* white-space:nowrap; */
      word-break:break-all;
      margin-bottom: 3px;
    }
    .logs_title {
      word-break:break-all;
    }
  }


@media screen and (max-width:968px) {
  .swappage {
    width: 96%;
  }
  .buttonSwapper, .m_swap {
    flex-wrap: wrap;
  }

}
`