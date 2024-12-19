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
    /* color: #fff; */

    .auth_title {
      font-size: 18px;
      /* font-weight: 600; */
      margin-bottom: 10px;
    }
  }
`