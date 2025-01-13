import styled from "styled-components";

export const List = styled.div`
    margin-top:30px;
    width:100%;
    border:1px solid #4d4d4d;
    padding:10px;
    border-radius:4px;
    table{
        width:100%;
        text-align:center;
        border-collapse: collapse;
        line-height:50px;
    }
    table thead{
        border-bottom:1px solid #4d4d4d;
    }
    table tbody tr:last-child{
        border:none;
    }
    table  tr{
        border-bottom:1px solid #4d4d4d;
    }
    input{
        width:20px;
    }
`

export const Page = styled.div`
    .btn{
        width:150px;
    }
    li{
        margin:50px 0 20px;
        line-height:50px;
    }
`

export const Mobile = styled.div`
    line-height:40px;
    border:1px solid #4d4d4d;
    padding:10px;
    margin:20px 0;
    border-radius:4px;
`