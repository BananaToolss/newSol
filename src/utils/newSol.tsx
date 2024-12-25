

import { base, KEY, network } from '@/config'

export const getAllToken = (account: string) => {
  return new Promise(async (resolve: (value: any) => void, reject) => {
    try {
      const myHeaders = new Headers();
      myHeaders.append("x-api-key", KEY);
      const requestOptions: any = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
      };
      const data = await fetch(
        `${base}/sol/v1/wallet/all_tokens?network=${network}&wallet=${account}`
        , requestOptions)
        .then(response => response.json())
      console.log(data, 'data')
      resolve(data.result)
    } catch (error) {
      reject(error)
    }
  })
}