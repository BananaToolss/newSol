import styled from "styled-components";

export const CreatePage = styled.div`


.itemSwapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 26px;
  .item {
    width: 48%;
  }
  .textarea {
    width: 100%;
    textarea {
      height: 100px;
    }
  }
}
.mb26 {
  margin-bottom: 26px;
}
.authority_box {
  background: #f6f6f6;
  /* padding: 20px; */
  border-radius: 6px;
  width: 32%;
  margin-bottom: 10px;


  .authority_titlt {
    display: flex;
    border-bottom: 1px solid #333;
    padding: 20px;
    font-size: 16px;
    justify-content: space-between;
    font-weight: 600;
  }
  .authority_content {
    padding: 20px;
    text-align: start;
    font-size: 14px;
  }
}

.imgswapper {
  border: 1px solid #858181;
  padding: 20px;
  border-radius: 10px;
  width: auto;
}
.imagetext {
  font-size: 13px;
  margin-left: 30px;
  color: #434040;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  .hit {
    color: #858181;
  }
}

.vanity {
    border: 1px solid #5d5b5b;
    border-radius: 10px;
    margin: 10px 0 30px;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.hint {
    margin-top: 10px;
    color: #5d5b5b;
    font-size: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid #5d5b5b;
}
.options {
    padding: 20px 0;
    border-bottom: 1px solid #e6dbdb;
}


@media screen and (max-width:968px) {
   .itemSwapper {
    flex-direction: column;
    margin-bottom: 0;
     .item {
      width: 100%;
      margin-bottom: 10px;
     }
   }
   .authority_box {
    width: 100%;
   }
   .imgswapper {
    flex-direction: column;
    text-align: center;
   }
   .btn {
     button {
      width: 100%;
     }
   }
   .mb26 {
    margin-bottom: 0;
   }
   .mb10 {
    margin-bottom: 10px; 
   }
}
`