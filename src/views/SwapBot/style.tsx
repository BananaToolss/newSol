import styled from "styled-components";

export const SwapBotPage = styled.div`
   .swap {
     display: flex;
   }
   .btn {
    text-align: center;
    button  {
      width: 30%;
      box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset;
    }
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
   .logs a{
    word-break:break-all;
   }
`
export const Card = styled.div`
    margin: 20px 0;
    background-color: #162127;
    color: #fff;
    border-radius: 6px;
    width: 33%;
    border: 2px solid #51d38e;
   
    .cardh {
      padding: 10px;
      border-bottom: 1px solid #283238;
      padding-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .title {
        font-weight: 600;
      }
    }
    .cardItem {
      padding: 0 10px;
      margin: 12px 0;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      background-color: #1a2830;
      padding: 10px;
      border-radius: 0 0 6px 6px;
    }
`
