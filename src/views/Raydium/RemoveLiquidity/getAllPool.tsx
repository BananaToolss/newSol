import { gql, GraphQLClient } from "graphql-request";
import { KEY, isMainnet } from '@/config'

const main = `https://programs.shyft.to/v0/graphql/?api_key=${KEY}&network=mainnet-beta`
const dev = `https ://programs.shyft.to/v0/graphql/?api_key=${KEY}&network=devnet`

function queryLpByToken(token: string) {
  const endpoint = main

  const graphQLClient = new GraphQLClient(endpoint, {
    method: `POST`,
    jsonSerializer: {
      parse: JSON.parse,
      stringify: JSON.stringify,
    },
  });
  // Get all proposalsV2 accounts
  const query = gql`
    query MyQuery($where: Raydium_LiquidityPoolv4_bool_exp) {
  Raydium_LiquidityPoolv4(
    where: $where
  ) {
    _updatedAt
    amountWaveRatio
    baseDecimal
    baseLotSize
    baseMint
    baseNeedTakePnl
    baseTotalPnl
    baseVault
    depth
    lpMint
    lpReserve
    lpVault
    marketId
    marketProgramId
    maxOrder
    maxPriceMultiplier
    minPriceMultiplier
    minSeparateDenominator
    minSeparateNumerator
    minSize
    nonce
    openOrders
    orderbookToInitTime
    owner
    pnlDenominator
    pnlNumerator
    poolOpenTime
    punishCoinAmount
    punishPcAmount
    quoteDecimal
    quoteLotSize
    quoteMint
    quoteNeedTakePnl
    quoteTotalPnl
    quoteVault
    resetFlag
    state
    status
    swapBase2QuoteFee
    swapBaseInAmount
    swapBaseOutAmount
    swapFeeDenominator
    swapFeeNumerator
    swapQuote2BaseFee
    swapQuoteInAmount
    swapQuoteOutAmount
    systemDecimalValue
    targetOrders
    tradeFeeDenominator
    tradeFeeNumerator
    volMaxCutRatio
    withdrawQueue
    pubkey
  }
}`;

  //Tokens can be either baseMint or quoteMint, so we will check for both with an _or operator
  const variables = {
    where: {
      _or: [
        { baseMint: { _eq: token } },
        { quoteMint: { _eq: token } },
      ]
    }
  };

  return new Promise(async (resolve: (value: any) => void, reject) => {
    try {
      const data = await graphQLClient.request(query, variables);
      resolve(data)
    } catch (error) {
      reject(error)
    }
  })
}

export default queryLpByToken

