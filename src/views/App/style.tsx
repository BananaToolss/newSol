import styled from "styled-components";
import bg_png from '../../assets/bg.png'

export const AppPage = styled.div`
 text-align: center;
 letter-spacing: 1px;
 padding: 40px;
  
 .hitcolor {
  color: #64748b;
 }
 .burn {
   color: #2563eb;
 }
 .mb20 {
  margin-bottom: 20px;
 }
 .ml20 {
  margin-left: 20px;
 }
 .title1 {
    font-size: 3rem;
    font-weight: bold;
  }
  .title2 {
    font-size: 20px;
  }
  .title3 {
    font-size: 2rem;
    font-weight: bold;
  }
.header {
  width:80%;
  margin: 0 auto;
  text-align: center;
  button {
    border-radius: 20px;
    height: 50px;
    padding: 0 60px;
    background: linear-gradient(116deg,  #6253E1, #04BEFE) !important;
  }
}
  
@media screen and (max-width:968px) { 
  padding: 0;
  .header {
    width: 98%;
  }
}
`

export const ToolPage = styled.div`
  margin-top: 80px;

  .header {
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #dee2e6;

    img {
      width: 50px;
      height: 50px;
    }
  }

  .toolImg {
    img {
      width: 350px;
    }
  }
  .footerItem {
    margin: 30px 0;
  }
  .btn1 {
    button {
    border-radius: 10px;
    height: 50px;
    padding: 0 60px;
    background: linear-gradient(116deg,  #6253E1, #04BEFE) !important;
    margin-right: 20px;
  }
  }
  .btn2 {
    button {
    border-radius: 10px;
    height: 50px;
    padding: 0 30px;
    background: linear-gradient(116deg, #e2c214, #efda41, #f1a4aa) !important;
    color: #000;
    font-weight: bold;
  }
  }

  @media screen and (max-width:968px) { 

   .toolImg {
    img {
      width: 80%;
    }
  }
  .footerItem {
    flex-direction: column;
    .btn1 {
      margin-bottom: 20px;
      button {
        width: 80%;
        margin-right: 0;
      }
    }
    .btn2 {
      button {
        width: 80%;
      }
    }
  }

  }
`

