import styled from "styled-components";

export const SegmentdPage = styled.div`
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  padding: 2px 2px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;

  img {
    width: 16px;
    height: 16px;
    margin-right: 3px;
  }
  .item {
    padding: 0 16px;
  }
  .active {
    background-color:#395f78;
    color: #fff;
    border-radius: 6px;
  }
`