import styled from "styled-components";

export const CreateIDPage = styled.div`
  .token {
    display: flex;
    justify-content: space-between;

    .tokenItem {
      flex: 1;
    }
  }
  @media screen and (max-width:968px) { 
    .token {
      flex-direction: column;
    }
    .tokenItem {
      margin: 10px 0;
    }
  }
`