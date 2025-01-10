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
    .header {
      display: flex;
      justify-content: space-between;
    }
    img {
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
  }
`