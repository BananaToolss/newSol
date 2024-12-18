import styled from "styled-components";

export const VanityPage = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    .page {
    background-color: #f6f6f6;
    padding: 20px;
    margin: 20px 0;
    border-radius: 6px;
    }
    .left {
      width: 49%;
      .flexitem {
        display: flex;
        justify-content: space-between;
        padding-bottom: 24px;
        border-bottom: 1px solid #c2c0c0;
        .item {
            width: 48%;
        }
      }
    }
    .right {
      width: 49%;
      display: flex;
      flex-direction: column;
      .ritem {
        display: flex;
        flex-direction: column;
        justify-content: center;
        flex: 1;
        .ritem_item {
            margin: 4px 0;
            display: flex;
            justify-content: space-between;
        }
      }
    }

    button {
    color: #fff !important;
    font-weight: bold;
    height: 48px;
    border: none !important;
  }
  .button {
    margin: 30px 0 0 0;
    display: flex;
    justify-content: space-between;
  }
  .btn1, .btn1:hover {
    width: 48%;
    background-color: #e7e7e7 !important;
  }
  .btn2, .btn2:hover {
    width: 48%;
    background-color: #7179df !important;
  }
`