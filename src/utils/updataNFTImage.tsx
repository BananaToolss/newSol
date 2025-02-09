import axios from "axios";
import type { TOKEN_TYPE } from '../type'

let BASE_URL = 'https://upload.bananatools.xyz/upload'
// const BASE_URL = 'http://localhost:8001/upload'

export const upLoadImage = (data: TOKEN_TYPE, selectedFile: File | string, isFile: boolean) => {
  return new Promise(async (resolve: (value: string) => void, reject) => {
    try {

      const formdata = new FormData();
      if (isFile) {
        formdata.append("logo", selectedFile);
      } else {
        formdata.append("image", selectedFile);
        BASE_URL = `${BASE_URL}1`
      }

      formdata.append("name", data.name);
      formdata.append("symbol", data.symbol);
      formdata.append("description", data.description);

      if (data.website) {
        formdata.append("website", data.website);
      }
      if (data.telegram) {
        formdata.append("telegram", data.telegram);
      }
      if (data.twitter) {
        formdata.append("twitter", data.twitter);
      }
      if (data.discord) {
        formdata.append("discord", data.discord);
      }
      const requestOptions = {
        method: "POST",
        body: formdata,
      };
      const res = await fetch(BASE_URL, requestOptions)
      const resData = await res.text();
      //将NFT数据转化成JSON格式存储到变量中
      resolve(resData)
    } catch (error) {
      reject(error)
    }
  })
}
