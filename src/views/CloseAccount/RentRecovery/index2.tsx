
import { Connection, PublicKey } from "@solana/web3.js";
import {
    LAMPORTS_PER_SOL,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    Keypair,
} from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";

import base58 from "bs58";
import { useEffect, useState } from "react";
import {
    createTransferCheckedInstruction, createCloseAccountInstruction,
} from "@solana/spl-token";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

function App() {

    const wallet = useAnchorWallet();

    const cj = async () => {

        let connection = new Connection("https://fittest-sleek-brook.solana-devnet.quiknode.pro/65b0f84a7cd6cbd71316410d484539d88add68af");


        console.log(connection, "connection");


        // const { connection } = useConnection();

        console.log(wallet?.publicKey, "wallet");

        // let wallet = new Keypair(); //note this is not used
        let mint = new Keypair(); //note this is not used


        const sender = wallet?.publicKey;
        const receiver = new PublicKey("ELs49qjzLa1grx6JvJ1L6e9ys39yufjJVusQAWbkycra");

        const lamportsToSend = 1_000_000;

        const transferTransaction = new Transaction().add(
            createTransferCheckedInstruction(
                new PublicKey("D2uUC1b9feSKTgetp2d6UbkwLTHg36sAtqwbMuSL3LGM"), // from (should be a token account)
                new PublicKey("48pXrw8fS12LkfWJPTr3Mr4mYu3K4e3Did6aarttHaK2"), // mint
                new PublicKey("6KoWeXa9CNtxikjg1PzTQ8vM4pRuvRqDnsuR7KB22QLU"), // to (should be a token account)
                new PublicKey("5EFsfGpfe1uxvYsosyvXZcPCX7ogSUtpETxgWiU2bULa"), // from's owner
                2 * 1e9, // amount, if your decimals is 8, send 10^8 for 1 token
                9, // decimals
            ),
        );

        // 获取 recentBlockhash 并设置到交易中

        // 获取最新的 Blockhash
        const latestBlockhash = await connection.getLatestBlockhash();

        // 设置 recentBlockhash 和 feePayer
        transferTransaction.recentBlockhash = latestBlockhash.blockhash;
        transferTransaction.feePayer = sender;

        const transactionSignature = await wallet?.signTransaction(
            transferTransaction
        );

        console.log(transactionSignature, "transactionSignature");
        // 发送签署后的交易
        const txid = await connection.sendRawTransaction(
            transactionSignature!.serialize()
        );
        console.log(`哈希：https://explorer.solana.com/tx/${txid}`);

        const feePayer = Keypair.fromSecretKey(bs58.decode("5RJWinUh6RU5iAuBWDtPUaHFbUtbu2kZSLTFYe5vSRnVs7m1Ds9mcCwpcprzz1VncgstNFNbsBCLi6F34roS7hGv"));

        // zh2钱包
        const zh2wallet = Keypair.fromSecretKey(bs58.decode("21jaRB5AgxNCEjsoeRhXbjBYMSbztGsyxTbUK8xLkmrdaHBM8sdabo5QEt6xShWHY9WAeAjcwZCy1dZx8dB1dRyg"));



        // 获取钱包中所有代币账户，并将代币为0的账户全部关闭
        // wallet?.publicKey
        const slpList = await connection.getParsedTokenAccountsByOwner(
            zh2wallet.publicKey,
            {
                programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
            }
        );

        const tx = new Transaction();

        slpList.value.forEach(async (account) => {
            let tokenAccount = account.pubkey;
            let tokenAccountAmount = account.account.data.parsed.info.tokenAmount;
            let mintAddress = account.account.data.parsed.info.mint;


            if (tokenAccountAmount.uiAmount == 0) {

                tx.add(
                    createCloseAccountInstruction(
                        tokenAccount,
                        zh2wallet.publicKey,
                        zh2wallet.publicKey,
                    )
                )

            }

        })
        let txhash4 = await sendAndConfirmTransaction(
            connection,
            tx,
            // [feePayer, zh2wallet],
            [zh2wallet],

        )
        console.log(`关闭账户哈希：https://explorer.solana.com/tx/${txhash4}`);



        const provider = new AnchorProvider(connection, wallet as any, {
            commitment: "processed",
        });
        console.log(provider, "provider");

    }




    const [data, setData] = useState<any[]>([])
    const cz = async () => {

        let connection = new Connection("https://fittest-sleek-brook.solana-devnet.quiknode.pro/65b0f84a7cd6cbd71316410d484539d88add68af");

        console.log(connection, "connection");

        // const feePayer = new PublicKey("5EFsfGpfe1uxvYsosyvXZcPCX7ogSUtpETxgWiU2bULa");

        const walletPubkey = wallet?.publicKey;
        if (!walletPubkey) {
            console.log("你还未选择钱包！");
            return;
        } else {
            console.log("当前钱包公钥为：", walletPubkey?.toString());
        }
        // 获取当前钱包中的所有代币账户
        const accountList = await connection.getParsedTokenAccountsByOwner(
            walletPubkey as any,
            {
                programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // Solana Token 程序的公钥
            },
        );
        accountList.value.forEach(account => {
            const tokenAccountPubkey = account.pubkey;
            const tokenAccountAmount = account.account.data.parsed.info.tokenAmount;
            const mintPubkey = account.account.data.parsed.info.mint;

            if (tokenAccountAmount.uiAmount == 0) {
                setData(prev => [...prev, tokenAccountPubkey.toString()])
            }

            console.log("tokenAccountPubkey: ", tokenAccountPubkey.toString());
            console.log("tokenAccountAmount: ", tokenAccountAmount.uiAmount);
            console.log("mintDecimals: ", tokenAccountAmount.decimals);
            console.log("mintPubkey: ", mintPubkey);
            console.log("---------------------------------");
        });

        if (data.length == 0) {
            console.log("没有余额为0的代币账户！");
        }

    }

    // 获取你需要关闭的代币账户对应的字符串，将他存入arr数组中
    const [arr, setArr] = useState<any[]>([])
    // 处理复选框变化的函数
    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // 获取复选框对应的文本内容
        const labelText = event.target.closest('label')?.textContent?.trim();
        // 如果复选框被选中，则添加到 arr 数组中，否则移除
        if (event.target.checked) {
            setArr(prevItems => [...prevItems, labelText]);
        } else {
            setArr(prevItems => prevItems.filter(item => item !== labelText));
        }
    };


    // console.log("arr：", arr);

    // 关闭arr数组中对应的代币账户
    const gb = async () => {
        let connection = new Connection("https://fittest-sleek-brook.solana-devnet.quiknode.pro/65b0f84a7cd6cbd71316410d484539d88add68af");

        console.log(connection, "connection");

        // const feePayer = new PublicKey("5EFsfGpfe1uxvYsosyvXZcPCX7ogSUtpETxgWiU2bULa");

        const walletPubkey = wallet?.publicKey;
        if (!walletPubkey) {
            console.log("你还未选择钱包！");
            return;
        } else {
            console.log("当前钱包公钥为：", walletPubkey?.toString());
        }

        let tokenAccount: PublicKey;
        if (arr.length == 0) {
            console.log("未选择要关闭的代币账户！");
            return;
        } else {
            // 交易
            const tx = new Transaction()
            // 注意区块长度限制、最大1232、117个账户1273、108可以，大概112
            arr.forEach(account => {
                //关闭代币账户
                tokenAccount = new PublicKey(account);
                // console.log(`${account.toString()}代币账户关闭成功！`);
                tx.add(
                    createCloseAccountInstruction(
                        tokenAccount,
                        walletPubkey,
                        walletPubkey,
                    )
                );

            })
            //获取最近的区块哈希
            const latestBlockHash = await connection.getLatestBlockhash();
            // 将最近区块哈希和费用支付者写入到交易中
            tx.recentBlockhash = latestBlockHash.blockhash;
            tx.feePayer = walletPubkey;
            // 设置交易的签名者
            const signedTransaction = await wallet.signTransaction(
                tx
            );
            // 发送交易到网络中
            const txid = await connection.sendRawTransaction(
                signedTransaction.serialize()
            );
            console.log(`关闭账户哈希：https://explorer.solana.com/tx/${txid}`);



        }
    }

    const [accountArr, setAccountArr] = useState<any[]>([])
    const gb5 = async () => {

        // let connection = new Connection("https://devnet.helius-rpc.com/?api-key=ef412a6c-7b45-455e-8478-1124426819c5");
        let connection = new Connection("https://fittest-sleek-brook.solana-devnet.quiknode.pro/65b0f84a7cd6cbd71316410d484539d88add68af");

        console.log(connection, "connection");

        const walletPubkey = wallet?.publicKey;
        if (!walletPubkey) {
            console.log("你还未选择钱包！");
            return;
        } else {
            console.log("当前钱包公钥为：", walletPubkey?.toString());
        }
        // 获取当前钱包中的所有余额为0的代币账户
        const accounts = await connection.getParsedTokenAccountsByOwner(
            walletPubkey,
            {
                programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // Solana Token 程序的公钥
            },
        );
        accounts.value.forEach(account => {
            const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
            const tokenAccountPubkey = account.pubkey;

            if (balance == 0 && !accountArr.includes(tokenAccountPubkey.toString())) {
                setAccountArr(prev => [...prev, tokenAccountPubkey.toString()])
            }
        });
        console.log("start accountArr: ", accountArr);

        // 关闭accountArr中的前五个代币账户，如果不足五个，就全部关闭
        let tokenAccountPubkey: PublicKey;
        let str: String;
        for (var i = 0; i < 5; i++) {
            str = accountArr.shift()
            if (str) {
                // 关闭
                tokenAccountPubkey = new PublicKey(str);
                console.log("关闭账户：", tokenAccountPubkey.toString());

                let tx = new Transaction().add(
                    createCloseAccountInstruction(
                        tokenAccountPubkey,
                        walletPubkey,
                        walletPubkey,
                    )
                );

                let latestBlockHash = await connection.getLatestBlockhash();
                tx.recentBlockhash = latestBlockHash.blockhash;
                tx.feePayer = walletPubkey;

                let signedTransaction = await wallet.signTransaction(tx);

                let txhash = await connection.sendRawTransaction(
                    signedTransaction.serialize()
                );
                console.log(`关闭账户哈希：https://explorer.solana.com/tx/${txhash}`);



            } else {
                //当前账户不足五个，已经全部关闭
                console.log("账户不足五个，全部关闭完成！");
                break;
            }

            console.log("end accountArr: ", accountArr);

        }



    }




    return (
        <div>
            <div>关闭账户-回收Solana
            </div>
            <p>Solana上每个Token或NFT都需在首次获取时支付一定的SOL作为账户租金。通过几个简单的步骤，批量销毁您任何不需要的 NFT 或者代币并回收 SOL 租金。</p>


            <div>
                <div>
                </div>

                <div>测试-----------------------------------</div>
                <button onClick={cj}>创建</button>
                {/* <button onClick={gb}>查找代币账户</button> */}
                <button onClick={cz}>查找余额为0的代币账户</button><br />

                <div>
                    <ul>

                        {data.map(item => {
                            return (
                                <>
                                    <label>{item.toString()}
                                        1111111
                                        <input type="checkbox" onChange={handleCheckboxChange} />
                                    </label>
                                    <>
                                        <input type="checkbox" onChange={handleCheckboxChange} />
                                    </>
                                </>


                            )
                        })
                        }

                    </ul>
                </div>
                <button onClick={gb}>选择关闭代币账户</button><br />
                <button onClick={gb5}>一次性关闭五个代币账户</button><br />
            </div>
        </div>


    )
}

export default App