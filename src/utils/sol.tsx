import axios from 'axios'
import { NetworkURL } from '@/config'

export const getAsset = (token: string) => {
  return new Promise(async (resolve: (value: any) => void, reject) => {
    try {
      let _data = JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getAsset",
        "params": {
          "id": token,
          "options": {
            "showCollectionMetadata": true
          }
        }
      });

      let config1 = {
        method: 'post',
        maxBodyLength: Infinity,
        url: NetworkURL,
        headers: {
          'Content-Type': 'application/json'
        },
        data: _data
      };
      const response = await axios.request(config1)
      const data = response.data.result
      resolve(data)
    } catch (error) {
      reject(error)
    }
  })
}