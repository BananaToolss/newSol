import styled from 'styled-components';

export const SelectTokenPage = styled.div`
  border: 1px solid #d9d9d9;
  display: flex;
  padding: 10px;
  width: 400px;
  border-radius: 10px;

  .address {
    color: #595555;
  }
  .addtoken {
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: center;
    cursor: pointer;
    svg {
      font-size: 26px;
    }
  }
`

export const TOKEN_BOX = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  margin-top: 20px;
  margin-right: 10px;
  height: 40px;
  cursor: pointer;
`
export const AllTokenItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;

  border-radius: 10px;
  cursor: pointer;
  
  img {
    border-radius: 50%;
  }
  .allleft {
    display: flex;
    align-items: center;
  }
  .tokename {
    font-size: 12px;
    color: #888a8d;
  }
  &:hover {
    background-color: #f5f5f5;
  }
`