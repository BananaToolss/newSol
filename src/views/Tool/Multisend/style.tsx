import styled from "styled-components";

export const MultisendPage = styled.div`
  .errBtn {
    color: #fff !important;
    background-color: #fe9814 !important;
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
    flex: 1;
    button {
      width: 100%;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }
  }
  .back {
    border: 1px solid #7475e1;
    padding: 0 40px;
    height: 44px;
    display: flex;
    align-items: center;
    border-radius: 6px;
    margin-right: 10px;

    svg {
      fill: #7475e1;
    }
  }
`

export const SENDINFO = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
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
      font-size: 24px;
      font-weight: 600;
     }
     .fee {

     }
   }
   @media screen and (max-width:968px) { 
    flex-direction: column;
    .item {
      width: 100%;
      margin-bottom: 3px;
    }
  }
`
export const ERROR_PAGE = styled.div`
border: 1px solid red;
padding: 10px ;
border-radius: 6px;
  font-size: 14px;
`