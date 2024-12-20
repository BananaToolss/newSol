import axios from 'axios'
import { PublicKey, Connection } from '@solana/web3.js';
import { Metadata, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { NetworkURL } from '@/config'
import { fetcher } from './'

export const getAsset = (connection: Connection, token: string) => {
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

      let description = metadata.description ?? ''
      let website = metadata.website ?? ''
      let telegram = metadata.telegram ?? ''
      let discord = metadata.discord ?? ''
      let twitter = metadata.twitter ?? ''


      let image = data.content.links.image ?? ''

      const decimals = token_info.decimals
      const supply = (token_info.supply / 10 ** token_info.decimals).toString()
      const freeze_authority = token_info.freeze_authority ?? '已弃权'
      const mint_authority = token_info.mint_authority ?? '已弃权'
      const mutable = data.mutable ?? false
      const owner = data.authorities[0].address ?? ''
      const metadataUrl = data.content.json_uri ?? data.centent.files[0].uri
      //另外一种请求
      if (!image || !description) {
        const tokenMint = new PublicKey(token);
        const metadataPDA = PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            PROGRAM_ID.toBuffer(),
            tokenMint.toBuffer(),
          ],
          PROGRAM_ID,
        )[0]
        const metadataAccount = await connection.getAccountInfo(metadataPDA);

        const [metadata, _] = Metadata.deserialize(metadataAccount.data);

        if (metadata.data.uri) {
          try {
            let logoRes = await fetcher(metadata.data.uri);

            const _description = logoRes.description ?? logoRes.extensions.description ?? ''
            const _website = logoRes.website ?? logoRes.extensions.website ?? ''
            const _telegram = logoRes.telegram ?? logoRes.extensions.telegram ?? ''
            const _discord = logoRes.discord ?? logoRes.extensions.discord ?? ''
            const _twitter = logoRes.twitter ?? logoRes.extensions.twitter ?? ''

            if (!image && logoRes.image) image = logoRes.image
            if (!description && _description) description = _description
            if (!website && _website) website = _website
            if (!telegram && _telegram) telegram = _telegram
            if (!discord && _discord) discord = _discord
            if (!twitter && _twitter) twitter = _twitter
          } catch (error) {

          }
        }

      }


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

export const getTokenAccountsByOwner = async (token: string) => {
  try {
    let _data = JSON.stringify({
      "jsonrpc": "2.0",
      "id": 1,
      "method": "getTokenAccountsByOwner",
      "params": [
        token,
        {
          "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "encoding": "jsonParsed"
        }
      ]
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: NetworkURL,
      headers: {
        'Content-Type': 'application/json'
      },
      data: _data
    };

    const response = await axios.request(config)
    console.log(response)
  } catch (error) {
    console.log(error)
  }
}