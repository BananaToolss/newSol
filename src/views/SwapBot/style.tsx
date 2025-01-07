import styled from "styled-components";

export const SwapBotPage = styled.div`
   .swap {
     display: flex;
   }
`
export const LeftPage = styled.div`
  width: 45%;
  .box {
    border: 1px solid #cccccc;
    padding: 20px;
    border-radius: 6px;
  }
  .header {
    font-size: 16px;
    font-weight: 400;
    display: flex;
    justify-content: space-between;
  }
  .box1 {
    flex: 1;
    border: 1px solid #cccccc;
    padding: 10px;
    border-radius: 6px;
    .box1_header {
      border-bottom: 1px solid #cccccc;
      padding-bottom: 10px;
    }
  }
`

export const RightPage = styled.div`
   flex: 1;
   margin-left: 10px;
   display: flex;
   flex-direction: column;

   .logs {
     flex: 1;
     border: 1px solid #cccccc;
     margin-top: 10px;
     border-radius: 6px;
     padding: 20px 10px;
     .header {
      padding-bottom: 10px;
      border-bottom: 1px solid #cccccc;
      font-weight: 600;
     }
   }
`
