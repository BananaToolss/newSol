import axios from "axios";
import type { TOKEN_TYPE } from '../type'

// const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiYTNmOTJjNy05YjE5LTQ1YjgtODMwNC1iM2Q5MTQyYWM3Y2EiLCJlbWFpbCI6InlpMTc5MTc4QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJkYTM0NDAxNGY1ZGI2ZmFjNmQ5MCIsInNjb3BlZEtleVNlY3JldCI6IjAzNTQ5ZDk4YjI4ODkxYzVhMjVmMDdmNmZiOTk0OTlkOTE1YTE3ZTMyZWM0NGVkOWM5NmZjNDg2YTYxMzMzMDEiLCJpYXQiOjE3MTQ0NDc5NDF9.ntgzYg_mbV3pBdezkHN7ttZ734DTEH2htdKvM3l6Q1s'
// const BASE_URL = 'https://blue-electronic-herring-408.mypinata.cloud/ipfs/'
const BASE_URL = 'https://harlequin-worried-basilisk-670.mypinata.cloud/ipfs/'
// const BASE_URL = 'https://ipfs.io/ipfs/'
const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIyNTg0YjVmMi0yYWY0LTRmNTAtODQzMC1kYWQ0NDFmNzM1YzQiLCJlbWFpbCI6InllcjIyMDcyN0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiOTRlZTc4YjExN2U4ZWE4MGE4ZjkiLCJzY29wZWRLZXlTZWNyZXQiOiI5MWJhYzM4MjQyMmJjMmRjNzE4YTI1MDU0NGJlZDViYzc2YWQ1ZTJjYjAzNzc3MjQ2ZmQ1ZDIzZDAwOTA0ZGM0IiwiZXhwIjoxNzY5MDc0NDg5fQ.suamCNyBdU037TKqjp4uA5IvG6oiLkO2lwURbGE-zkc'

export const upLoadImage = (data: TOKEN_TYPE, selectedFile: File | string, isFile: boolean) => {
  return new Promise(async (resolve: (value: string) => void, reject) => {
    try {
      let image_url = ''
      if (isFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const metadata = JSON.stringify({
          name: data.symbol,
        });
        formData.append("pinataMetadata", metadata);

        const options = JSON.stringify({
          cidVersion: 0,
        });
        formData.append("pinataOptions", options);

        const res = await fetch(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${JWT}`,
            },
            body: formData,
          }
        );
        const resData = await res.json();
        //得到图片链接
        image_url = `${BASE_URL}${resData.IpfsHash}`
      } else {
        image_url = selectedFile as string
      }
      //上传元数据
      const meta_data = {
        pinataContent: {
          name: data.name, //NFT名称
          symbol: data.symbol,
          description: '',  //NFT描述
          image: image_url, //NFT图像
          extensions: {
          },
          tags: []
        },
        pinataMetadata: {
          name: `${data.symbol}.json`  //NFT的存储名称
        }
      }


      if (data.website) {
        meta_data.pinataContent.extensions['website'] = data.website
      }
      if (data.telegram) {
        meta_data.pinataContent.extensions['telegram'] = data.telegram
      }
      if (data.twitter) {
        meta_data.pinataContent.extensions['twitter'] = data.twitter
      }
      if (data.discord) {
        meta_data.pinataContent.extensions['discord'] = data.discord
      }
      if (data.description) {
        meta_data.pinataContent.description = data.description
      }
      // if (data.tags) {
      //   const tags = data.tags.split(/[,，]+/)
      //   meta_data.pinataContent.tags = tags
      // }

      console.log(meta_data, 'meta_data')
      //将NFT数据转化成JSON格式存储到变量中
      const _data = JSON.stringify(meta_data)

      const result = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", _data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${JWT}`
        }
      });

      const _url = `${BASE_URL}${result.data.IpfsHash}`
      resolve(_url)
    } catch (error) {
      reject(error);
    }
  })
}

