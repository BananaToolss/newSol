import { ApiV3PageIns, ApiV3PoolInfoItem, PoolFetchType, WSOLMint } from "@raydium-io/raydium-sdk-v2";
import { initSdk, RaydiumApi } from "@/Dex/Raydium";
import { Keypair, PublicKey } from "@solana/web3.js";
import { message } from "antd";


export function normalizeRaydiumBetaPoolInfoResponse(
    response: ApiV3PoolInfoItem[] | ApiV3PageIns<ApiV3PoolInfoItem>
): ApiV3PoolInfoItem[] {
    if (response === null || typeof response !== "object") {
        return [];
    }
    const items = Array.isArray(response)
        ? response
        : ((!Array.isArray((response as any).data)
            ? []
            : (response as any).data) as ApiV3PoolInfoItem[]);
    return items.filter(
        (p) =>
            p !== null &&
            typeof p === "object" &&
            !!p.price &&
            !!p.mintAmountA &&
            !!p.mintAmountB &&
            p.mintA !== null &&
            typeof p.mintA === "object" &&
            p.mintB !== null &&
            typeof p.mintB === "object"
    );
}
//TODO 切换节点清除价格
export const getPumpPoolPrice = async (sdk: any, ids: string, tokenR: string): Promise<number> => {


    const tokenPool = await sdk.getBondingCurveAccount(new PublicKey(tokenR));

    const tokenPriceSol = (Number(tokenPool?.getMarketCapSOL()) / 10 ** 18);
    const price = tokenPriceSol;

    return price;
};
// 根据池子id获取价格
export const getPoolPrice = async (ids: string): Promise<number> => {
    const tokenPool = normalizeRaydiumBetaPoolInfoResponse(
        await RaydiumApi.fetchPoolById({ ids })
    );
    // console.log(tokenPool, "获取池子信息");
    const price = !tokenPool
        ? 0
        : tokenPool[0].mintA.address === WSOLMint.toBase58()
            ? 1 / tokenPool[0].price
            : tokenPool[0].price;
    return price;
};

//获取池子账户
export const getMarketValuePoolInfo = async (tokenL: string, tokenR: string, poolType: string, newConnection: any, pool: string) => {

    const owner0 = new Keypair();
    if (!tokenR) {
        message.error("请输入目标代币");
        return;
    }
    let price: any
    let poolId: string
    try {
        //主网获取池子
        if (localStorage.getItem("rpc_name") == "Main") {
            //判断是否导入代币

            //通过代币获取池子
            const tokenPool = normalizeRaydiumBetaPoolInfoResponse(
                await RaydiumApi.fetchPoolByMints({
                    mint1: tokenR,
                    mint2: tokenL,
                    type: PoolFetchType.Standard,
                })
            ).find(poolType == 'RaydiumV2' ?
                (p) => p.programId == "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8" :
                (p) => p.programId == "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C");
            console.log(tokenPool, 'tokenPool')

            //保存池子id
            if (tokenPool) {
                price = tokenPool.mintA.address == tokenR ? tokenPool.price : 1 / tokenPool.price;
                poolId = tokenPool.id
            } else {
                price = 0
                poolId = "没有查到池子，请刷新重试"
            }
        } else {
            const raydium = await initSdk({ owner: owner0, connection: newConnection });
            // console.log(raydium, 'raydium')
            const data = await raydium.liquidity.getPoolInfoFromRpc({ poolId: pool });
            price =
                data.poolInfo.mintA.address == tokenL
                    ? data.poolInfo.mintAmountA / data.poolInfo.mintAmountB
                    : data.poolInfo.mintAmountB / data.poolInfo.mintAmountA;
            poolId = pool
        }
        const aa = Number(price).toFixed(18);
        price = aa
        return { price, poolId }
    } catch (error) {
        console.log(error, 'error')
    }

};
