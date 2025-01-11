import styled from "styled-components";

export const CreatePool = styled.div`
  .token {
    display: flex;
    justify-content: space-between;

    .tokenItem {
      flex: 1;
    }
  }
  .card {
    background-color: #fff7ec;
    padding: 20px;
    margin: 10px 0;
    border-radius: 6px;
    border: 1px solid #dfd4c4;
    .info {
      border-bottom: 1px solid #ccc;
      padding-bottom: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
    }
    img {
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
    .card1 {
      margin-top: 20px;
      font-size: 16px; 
    }
    .ant-segmented-item {
      flex: 1;
    }
    .ant-segmented.ant-segmented-lg {
      width: 80%;
    }
  }
`