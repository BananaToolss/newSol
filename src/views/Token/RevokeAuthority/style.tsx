import styled from "styled-components";

export const AuthorityPage = styled.div`
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

  .leftTitel  {
    width: 30%;
    text-align: start;
  }

  .auth_box {
    border: 1px solid #6cedbf;
    padding: 20px;
    text-align: start;
    border-radius: 6px;
    margin-bottom: 10px;
    background-image: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
    display: flex;
    align-items: center;
    justify-content: space-between;

    .auth_title {
      font-size: 18px;
      /* font-weight: 600; */
      margin-bottom: 10px;
    }
    .auti_title1 {
      font-size: 16px;
      color: #58585b;
    }
    .right {
      display: flex;
      align-items: center;
      justify-content: end;
      width: 30%;
      white-space:nowrap;
    }
    .right_t1 {
      background-color: #87d068;
      font-size: 12px;
      color: #fff;
      padding: 1px 10px;
      border-radius: 2px;
      margin-right: 6px;
    }
    .right_t2 {
      background-color: #108ee9;
      font-size: 12px;
      color: #fff;
      padding: 1px 10px;
      border-radius: 2px;
      margin-right: 6px;
    }
  }
`