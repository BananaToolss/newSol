import styled from "styled-components";

export const Page = styled.div`
  width: 80%;
  padding: 50px;
  margin: 0 auto;
  font-size: 18px;

  .tokenInput {
     display: flex;
     align-items: center;

     .input {
       flex: 1;
       input {
        height: 48px;
       }
     }
   }
   .authorityBox {
    background-color: #f6f6f6;
    border-radius: 6px;
    font-size: 14px;
    color: #626262;
    padding: 14px;
   }
   .box {
     background-color: #00c853;
     color: #fff;
     display: inline-flex;
     align-items: center;
     border-radius: 4px;
     padding: 0 16px;
     margin-top: 4px;
   }
   .box1 {
     background-color: #ff5252;
     color: #fff;
     display: inline-flex;
     align-items: center;
     border-radius: 4px;
     padding: 0 16px;
     margin-top: 4px;
   }

  @media screen and (max-width:968px) {
    width: 100%;
    padding:50px 0;
}
`