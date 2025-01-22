import axios from "axios";
import type { TOKEN_TYPE } from '../type'

const BASE_URL = 'https://upload.bananatools.xyz/upload'

export const upLoadImage = (data: TOKEN_TYPE, selectedFile: File | string, isFile: boolean) => {
  return new Promise(async (resolve: (value: string) => void, reject) => {
    try {
      let image_url = ''
      if (isFile) {
        const formdata = new FormData();
        formdata.append("logo", selectedFile);
        const requestOptions = {
          method: "POST",
          body: formdata,
        };
        const res = await fetch(BASE_URL, requestOptions)
        const resData = await res.text();
        console.log(resData, 'resData')
        //得到图片链接
        image_url = `https://upload.bananatools.xyz/${resData}`
      } else {
        image_url = selectedFile as string
      }

      //上传元数据
      const meta_data = {
        name: data.name, //NFT名称
        symbol: data.symbol,
        description: '',  //NFT描述
        image: image_url, //NFT图像
        extensions: {
        },
        tags: []
      }
      console.log(meta_data, 'meta_data')
      if (data.website) {
        meta_data.extensions['website'] = data.website
      }
      if (data.telegram) {
        meta_data.extensions['telegram'] = data.telegram
      }
      if (data.twitter) {
        meta_data.extensions['twitter'] = data.twitter
      }
      if (data.discord) {
        meta_data.extensions['discord'] = data.discord
      }
      if (data.description) {
        meta_data.description = data.description
      }
      console.log(meta_data, 'meta_data')
      //将NFT数据转化成JSON格式存储到变量中
      const formdata = new FormData();
      const metaDataFile = new File(
        [JSON.stringify(meta_data)],
        "metadata.json",
        { type: "application/json" }
      );
      formdata.append("logo", metaDataFile);
      const requestOptions = {
        method: "POST",
        body: formdata,
      };
      const res = await fetch(BASE_URL, requestOptions)
      const resData = await res.text();
      resolve(`https://upload.bananatools.xyz/${resData}`)
    } catch (error) {
      reject(error)
    }
  })
}
