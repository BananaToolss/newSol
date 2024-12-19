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

      const token_info = data.token_info
      const metadata = data.content.metadata

      const name = metadata.name
      const symbol = metadata.symbol

      const description = metadata.description ?? ''
      const website = metadata.website ?? ''
      const telegram = metadata.telegram ?? ''
      const discord = metadata.discord ?? ''
      const twitter = metadata.twitter ?? ''


      const image = data.content.links.image ?? ''

      const decimals = token_info.decimals
      const supply = (token_info.supply / 10 ** token_info.decimals).toString()
      const freeze_authority = token_info.freeze_authority ?? '已弃权'
      const mint_authority = token_info.mint_authority ?? '已弃权'
      const mutable = data.mutable ?? false
      const owner = data.authorities[0].address ?? ''
      const metadataUrl = data.content.json_uri ?? data.centent.files[0].uri


      resolve({
        name, symbol, description, website, twitter,
        telegram, discord, image, decimals, supply,
        freeze_authority, mint_authority,
        mutable,
        owner,
        metadataUrl
      })
    } catch (error) {
      reject(error)
    }
  })
}