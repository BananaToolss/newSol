import styled from "styled-components";

export const Page = styled.div`
  width: 80%;
  padding: 50px;
  margin: 0 auto;
  font-size: 18px;

  .hint {
    margin-top: 10px;
    color: #5d5b5b;
    font-size: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid #5d5b5b;
  }
`

export const CreatePage = styled.div`
margin-top: 50px;

.itemSwapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 26px;
  .item {
    width: 48%;
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
`