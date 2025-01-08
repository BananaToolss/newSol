import { Api, Raydium, TxVersion, parseTokenAccountResp } from '@raydium-io/raydium-sdk-v2'
import { Connection, Keypair } from '@solana/web3.js'


export const txVersion = TxVersion.V0 // or TxVersion.LEGACY
const cluster = 'devnet' // 'mainnet' | 'devnet'  //切换    //测试网兼容主网，反之不然

let raydium: Raydium | undefined
export const initSdk = async (params: { owner: Keypair, connection: Connection, loadToken?: boolean }) => {
  // if (raydium) return raydium
  // console.log(`connect to rpc ${connection.rpcEndpoint} in ${cluster}`)
  // console.log("init");
  raydium = await Raydium.load({
    owner: params.owner,
    connection: params.connection,
    cluster,
    disableFeatureCheck: true,
    // disableLoadToken: !params?.loadToken,
    disableLoadToken: true,
    // blockhashCommitment: 'finalized',
    blockhashCommitment: 'processed',
    // urlConfigs: {
    //   BASE_HOST: '<API_HOST>', // api url configs, currently api doesn't support devnet
    // },
  })

  /**
   * By default: sdk will automatically fetch token account data when need it or any sol balace changed.
   * if you want to handle token account by yourself, set token account data after init sdk
   * code below shows how to do it.
   * note: after call raydium.account.updateTokenAccount, raydium will not automatically fetch token account
   */
  /*  
  raydium.account.updateTokenAccount(await fetchTokenAccountData())
  connection.onAccountChange(owner.publicKey, async () => {
    raydium!.account.updateTokenAccount(await fetchTokenAccountData())
  })
  */

  // raydium.account.updateTokenAccount(await fetchTokenAccountData(params.owner, params.connection))
  return raydium
}

export const RaydiumApi = new Api({
  cluster: cluster,
  timeout: 5000,
})