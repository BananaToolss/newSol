import styled from "styled-components";

export const BurnPage = styled.div`
  width: 100%;
 
  .infobox {
    font-size: 16px;
    display: flex;
    justify-content: space-between;
    background-color: #fafafa;
    .info_item {
      flex: 1;
      border: 1px solid #cccccc;
      padding: 20px;
      border-radius: 6px;
    }
  }
  @media screen and (max-width:968px) {  
    .infobox {
      flex-direction: column;
    }
    .info_item  {
      margin-left: 0;
      margin-bottom: 6px;
    }
  }
  @media screen and (max-width:968px) {
    width: 100%;
}
`