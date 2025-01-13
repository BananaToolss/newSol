import styled from "styled-components";

export const CollectorPage = styled.div`
   text-align: start;

   .segmentd {
    margin-top: 30px;
    text-align: center;
    
    .ant-segmented.ant-segmented-lg {
      width: 100%;
    }
    .ant-segmented-item {
      width: 50%;
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
  }
  
 
  .bb {
    border: 1px solid red;
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

  .hit_c {
    font-size: 14px;
    color: #fd9715;
  }
  .collect_type {
     background: #f6f6f6;
     padding: 20px;
     border-radius: 6px;

     .co_title {
      font-size: 20px;
      font-weight: 600;
     }
     .co_item {
      margin-bottom: 10px;
     }
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
  .one_btn {
    background: #63e2bd;
    color: #fff;
    border-radius: 6px;
    padding: 0 5px;
    margin-right: 8px;
  }
  .infobox {
    font-size: 16px;
    display: flex;
    justify-content: space-between;

    .info_item {
      flex: 1;
      border: 1px solid #cccccc;
      padding: 20px;
      border-radius: 6px;
    }
  }
  @media screen and (max-width:968px) {  
    .infobox {
      flex-direction: column;
    }
    .info_item  {
      margin-left: 0;
      margin-bottom: 6px;
    }
  }

`