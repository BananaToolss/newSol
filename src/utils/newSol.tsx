

import { isMainnet } from '@/config'

const KEY = 'dCV9zeef_E-v4OVl'
const base = 'https://api.shyft.to'

const fetcher = (args: any) => fetch(args).then((res) => res.json())

export const getAllToken = async (account: string) => {
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
    console.log(data, 'data')

  } catch (error) {
    console.log(error, 'error')
  }
}