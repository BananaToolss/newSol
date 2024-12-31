import styled from "styled-components";

export const MultisendPage = styled.div`

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
  .bw100 {
    button {
      width: 100%;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }
  }
`

export const SENDINFO = styled.div`
  display: flex;
  justify-content: space-between;
   .item {
     width: 23%;
     background-color: #fff5e8;
     padding: 20px;
     border-radius: 6px;
     display: flex;
     flex-direction: column;
     justify-content: space-between;
     align-items: center;

     .t1 {
      font-size: 13px;
      color: #85807a;
     }
     .t2 {
      font-size: 22px;
     }
     .fee {
      
     }
   }
`