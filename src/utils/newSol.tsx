

import { isMainnet } from '@/config'

const KEY = 'dCV9zeef_E-v4OVl'
const base = 'https://api.shyft.to'

const fetcher = (args: any) => fetch(args).then((res) => res.json())

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
        `${base}/sol/v1/wallet/all_tokens?network=mainnet-beta&wallet=${account}`
        , requestOptions)
        .then(response => response.json())
      resolve(data.result)
    } catch (error) {
      reject(error)
    }
  })
}