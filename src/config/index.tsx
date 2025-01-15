export const TELEGRAMLINK = 'https://t.me/BananaTools'


export const isMainnet = true
export const isDev = true
export const Devnet = 'https://devnet.helius-rpc.com/?api-key=812db19f-55d0-417a-8e7e-0ade8df22075'
export const Testnet = 'https://api.testnet.solana.com/'
// export const Mainnet = "https://mainnet.helius-rpc.com/?api-key=812db19f-55d0-417a-8e7e-0ade8df22075"
export const Mainnet = "https://vivianne-g1n6x7-fast-mainnet.helius-rpc.com/"
export const NetworkURL = isMainnet ? Mainnet : isDev ? Devnet : Testnet;


export const KEY = 'dCV9zeef_E-v4OVl'
export const base = 'https://api.shyft.to'
export const network = isMainnet ? 'mainnet-beta' : isDev ? 'devnet' : 'testnet'




export const OPENBOOK_PROGRAM_ID_MAINNET = 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'
export const OPENBOOK_PROGRAM_ID_DEVNET = 'EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj'
//   EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj
export const OPENBOOK_PROGRAM_ID = isMainnet ? OPENBOOK_PROGRAM_ID_MAINNET : OPENBOOK_PROGRAM_ID_DEVNET;

export const PROJECT_NAME = 'BananaTools'
export const BANANATOOLS_ADDRESS = 'HoeFkdmh4oKFwC1wLmCkC63bSuahRhvCPWYY8sybwEyn'

export const CREATE_TOKEN_FEE = 0.1 //创建代币费用
export const UPDATE_FEE = 0.05
export const AUTHORITY_FEE = 0.05  //权限放弃费用
export const MINT_TOKEN_FEE = 0.05 // 代币增发
export const FREE_TOKEN_FEE = 0.08 //冻结账户
export const BURN_FEE = 0.05 //烧烧代币
export const MARKET_FEE = 0.1 //市场 
export const CREATE_POOL_FEE = 0.1 //创建流动性
export const REMOVE_POOL_FEE = 0.05
export const MULTISEND_FEE = 0.008 //批量转账费用
export const COLLECT_FEE = 0.01 //批量归集

export const PUMP_CREATE_FEE = 0.05// pump创建代币
export const PUMP_CREATE_BIND_FEE = 0.01 //捆绑买入
export const SWAP_BOT_FEE = 0.0001 //市值每笔收费
export const PUMP_SWAP_BOT_FEE = 0.0001 //pump市值收费
export const CLOSE_FEE = 1 //1%
export const CLOSE_VALUE = 0.002039


export const Input_Style = 'form-control block w-full px-4 py-2 text-lg font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none'

// export const Button_Style = 'px-8 m-2 btn animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ...'
export const Button_Style = 'px-8 btn  bg-gradient-to-r from-[#9945FF] to-[#14F195] '

export const Button_Style1 = 'px-8 btn'


export const Text_Style = 'text-3xl autowb font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]'
export const Text_Style1 = 'text-xl autowb font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]'



