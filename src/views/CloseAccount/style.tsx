import styled from "styled-components";

export const CardSwapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`

export const Card = styled.div`
   margin: 10px;
   width: 200px;
   text-align: start;
   border: 1px solid #512da8;
   border-radius: 6px;
   overflow: hidden;
   display: flex;
   flex-direction: column;
   justify-content: center;
   align-items: center;
   background-color: #15263f;
   
   .header {
    display: flex;
    justify-content: center;
    position: relative;
    padding: 20px;
    img {
      width: 80%;
      border-radius: 50%;
    }
   }

   .active {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #bf39f1;
    opacity: 0.8;
    color: #fff;
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
   }

   .footer {
     width: 100%;
     background-color: #fff;
     padding: 10px;
     .name {
      font-weight: 600;
      font-size: 16px;
     }
     .address {
      color: #a6b4c8;
     }
   }
`