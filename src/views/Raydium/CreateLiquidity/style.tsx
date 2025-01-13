import styled from "styled-components";

export const CreatePool = styled.div`
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
  }
`