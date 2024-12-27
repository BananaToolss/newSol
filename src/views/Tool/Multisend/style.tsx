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