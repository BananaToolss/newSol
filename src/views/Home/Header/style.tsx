import styled from 'styled-components';
export const SettingPage = styled.div`
font-size: 14px;
  position: absolute;
  left: -250px;
  background-color: #ffffff;
  padding: 10px 30px;
  line-height: 1.5;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
  width: 500px;

  .hint {
    font-size: 12px;
    margin: 10px 0;
    color: #666666;
  }
  .ant-segmented.ant-segmented-lg {
    width: 100%;
  }
  .ant-segmented .ant-segmented-group {
    width: 100%;
  }
  .ant-segmented-item {
    width: 33%;
  }
  .ant-segmented .ant-segmented-item-selected{
     background-color: #ff9815;
  }
  .showvalue {
    display: flex;
    justify-content: space-around;
  }
  .ht {
    font-weight: bold;
    font-size: 16px;
  }

  .rpc {
    border-top: 1px solid #9f9c9c;
    padding-top: 10px;
    margin-top: 20px;
  }
`