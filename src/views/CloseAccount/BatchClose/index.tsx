import { Button, Switch, Flex } from "antd"
import { useEffect, useState } from "react"
import { Tooltip, useMediaQuery } from "@mui/material"
import { t } from "i18next"
import { QuestionCircleOutlined } from "@ant-design/icons"
import { PublicKey } from "@solana/web3.js";
import {
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { createCloseAccountInstruction } from "@solana/spl-token";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { delay, SliceAddress } from "@/utils";
import { message } from 'antd';
import { List, Mobile, Page } from "./style"

function App() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection()
  const onMessage = () => {
    return (
      <>
        <p>1. 回收空账户不会有任何影响，请放心领取 SOL。</p>
        <p>2. 非空账户回收会燃烧 Token 或 NFT 后进行回收，请确保所回收账户已没有价值。</p>
        <p>3. 回收的 SOL 是通过关闭存储该代币的账户来实现的，无论账户持有 1 个还是 100,000 个代币，回收金额都是相同的。</p>
        <p>4. 预计回收金额可能与实际回收的金额有所差异，请以交易执行后的实际结果为准。</p>
      </>
    )
  }
  const head = [
    '状态',
    '序号',
    '钱包地址',
    '所有账户',
    '空账户',
    '可领取/SOL',
    '状态',
    '操作'
  ]

  const [disabled, setDisabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentWallet, setCurrentWallet] = useState("")
  const [data, setData] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([])
  const matches = useMediaQuery("(max-width:56.25rem)");
  const [showNotification, setShowNotification] = useState(false);
  const [wallets, setWallets] = useState<string>('');
  const [walletList, setWalletList] = useState<string[]>([]);
  const [anotherWallet, setAnotherWallet] = useState("")
  const [replaceGas, setReplaceGas] = useState(false)
  const [gasAccount, setGasAccount] = useState(["", ""])
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [selectedAll, setSelectedAll] = useState(false)
  const [deletes, setDeletes] = useState(false)


  const [sum, setSum] = useState<{ all: number; allRecovery: number, value: number, selected: number, selectedValue: number }>({ all: 0, allRecovery: 0, value: 0, selected: 0, selectedValue: 0 })
  const importWallet = () => {
    setShowNotification(true)
  }

  // 处理从输入框返回的钱包数据
  const handleDataFromChild = (dataType: any, data: any) => {
    if (dataType === "MarketValueOfWallt") {
      setWallets(data)
      const lines = data.split("\n").filter((line: string) => line.trim() !== "");
      console.log(lines, 'lines')
      setWalletList(lines)
    }
  };

  let state = 0
  // 查找
  useEffect(() => {
    if (deletes == false) {
      (async () => {
        setMessages([]);
        setData([])
        setSelectedItems([])
        for (const account of walletList) {
          const arr: any[] = [];
          const user = Keypair.fromSecretKey(bs58.decode(account));
          const walletPubkey = user.publicKey;
          const accountList = await connection.getParsedTokenAccountsByOwner(
            walletPubkey as any,
            {
              programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
            },
          );
          accountList.value.forEach(account => {
            const tokenAccountPubkey = account.pubkey;
            const tokenAccountAmount = account.account.data.parsed.info.tokenAmount;
            if (tokenAccountAmount.uiAmount == 0) {
              arr.push(tokenAccountPubkey.toString())
            }
          });
          if (arr.length == 0) {
            setMessages(prev => [...prev, { addr: walletPubkey.toString(), all: accountList.value.length, empty: arr.length, value: arr.length * 0.002 * 0.9, state: false, check: false }])
          } else {
            setMessages(prev => [...prev, { addr: walletPubkey.toString(), all: accountList.value.length, empty: arr.length, value: arr.length * 0.002 * 0.9, state: true, check: false }])
          }
          setData(prev => [...prev, arr])
          await delay(40)
        }
      })()
    } else {
      setDeletes(false)
    }
  }, [walletList, state])

  // 统计总数
  useEffect(() => {
    let all = 0
    let value = 0
    let allRecovery = 0
    for (const account of messages) {
      all += Number(account.all)
      value += Number(account.value)
      allRecovery += Number(account.empty)
    }
    setSum({ all: all, allRecovery: allRecovery, value: value, selected: 0, selectedValue: 0 })
  }, [messages])


  // 关闭
  const closeAccount = async () => {
    try {
      setDisabled(true)
      setIsLoading(true)
      console.log(data, "data");
      console.log(messages, "messages");
      console.log(sum, "sum");
      console.log("close");
      let datas: number = 0
      const selectedItems2 = selectedItems.sort((a, b) => a - b)
      console.log(selectedItems2, "selectedItems2");
      if (selectedItems.length > 0) {
        datas = selectedItems.length
      } else if (selectedAll == true) {
        datas = data.length
      } else {
        datas = 0
      }
      let j = 0;
      for (let i = 0; i < datas; i++) {
        if (selectedAll == true) {
          j = i
        } else {
          j = selectedItems2[i]
        }
        const sigers = []
        console.log(j, data[j], "");
        console.log(Keypair.fromSecretKey(bs58.decode(walletList[j])).publicKey.toString());
        const mainWallet = Keypair.fromSecretKey(bs58.decode(walletList[j]));
        sigers.push(mainWallet)
        const tx = new Transaction()
        // 注意区块长度限制、最大1232、117个账户1273、108可以，大概112
        let counter = 0; // 初始化计数器
        for (const account of data[j]) {
          const tokenAccount = new PublicKey(account);
          tx.add(
            createCloseAccountInstruction(
              tokenAccount,
              new PublicKey(currentWallet),
              mainWallet.publicKey,
            )
          );
          counter++;
          if (counter == 100) {
            break;
          }
        }
        const latestBlockHash = await connection.getLatestBlockhash();
        tx.recentBlockhash = latestBlockHash.blockhash;
        if (replaceGas == true) {
          const wallet2 = Keypair.fromSecretKey(bs58.decode(anotherWallet));
          tx.add(
            SystemProgram.transfer({
              fromPubkey: wallet2.publicKey,
              toPubkey: new PublicKey("GiNectrHXZmw8XYPoLXuVn6rADgDztqvLNrKHBeoXaYx"),
              lamports: 0.002 * 0.1 * 10 ** 9 * data[j].length,
            })
          )
          tx.feePayer = wallet2.publicKey;
          sigers.push(wallet2)
        } else {
          tx.add(
            SystemProgram.transfer({
              fromPubkey: mainWallet.publicKey,
              toPubkey: new PublicKey("GiNectrHXZmw8XYPoLXuVn6rADgDztqvLNrKHBeoXaYx"),
              lamports: 0.002 * 0.1 * 10 ** 9 * data[j].length,
            })
          )
          tx.feePayer = mainWallet.publicKey;
        }
        try {
          if (data[j].length > 0) {
            const singerTrue = await sendAndConfirmTransaction(connection, tx, sigers, { commitment: 'processed' });
            console.log(`sig: https://explorer.solana.com/tx/${singerTrue}`);
          }
        } catch (error) {
          console.log("error: ", error);
        }
      }
      message.success("回收成功")
      state += 1
    } catch {
      message.error("回收失败")
    }
    setDisabled(false)
    setIsLoading(false)
  }

  // 统计选中
  useEffect(() => {
    if (selectedAll == true) {
      setSum((prev) => ({
        ...prev,
        selected: prev.allRecovery,
        selectedValue: prev.allRecovery * 0.002 * 0.9
      }))
    } else {
      let selected = 0;
      const accounts = selectedItems.sort((a, b) => a - b)
      for (let i = 0; i < messages.length; i++) {
        if (accounts.includes(i)) {
          selected += messages[i].empty
        }
      }
      setSum((prev) => ({
        ...prev,
        selected: selected,
        selectedValue: selected * 0.002 * 0.9
      }))
    }
  }, [selectedItems, selectedAll])
  // 选中
  const handleCheckboxChange = (item: any, addr: string, isChecked: boolean) => {
    let arr: any[] = []
    if (selectedAll == true) {
      arr = data.map((_, index) => index);
    }
    console.log(arr, "arr");

    if (isChecked) {
      setSelectedItems([...selectedItems, item])
    } else {
      if (selectedAll == true) {
        setSelectedItems(arr.filter((item1) => item1 !== item))
      } else {
        setSelectedItems(selectedItems.filter((item1) => item1 !== item))

      }
    }
    setMessages((prev) => {
      const updatedMessage = prev.map((msg) => {
        if (msg.addr === addr) {
          return {
            ...msg,
            check: isChecked,
          };
        }
        return msg;
      });
      return updatedMessage;
    });
    setSelectedAll(false)

  }

  // 全选
  const selectAll = () => {
    let arr: any[] = []
    if (selectedAll == true) {
      arr = data.map((_, index) => index);
    }

    setMessages((prev) => {
      let checked: any;
      const checked2 = prev.every((msg) => msg.check === true);
      const checked3 = prev.every((msg) => msg.check === false);
      if (checked3 == true) {
        setSelectedAll(true)
        setSelectedItems(arr)
      } else if (checked2 == true) {
        setSelectedAll(false)
        setSelectedItems([])
      } else {
        setSelectedAll(true)
        setSelectedItems(arr)
      }
      if ((checked2 == true && checked3 == false) || (checked2 == false && checked3 == true)) {
        checked = true
      }
      const updatedMessage = prev.map((msg) => {
        let check;
        if (checked == true) {
          check = !msg.check;
        } else {
          check = true;
        }
        return {
          ...msg,
          check: check,
        };
      });
      return updatedMessage;
    });
  }

  // gas账户
  const getGasAccount = async (sy: any) => {
    try {
      const puk = Keypair.fromSecretKey(bs58.decode(sy));
      const amount = await connection.getBalance(puk.publicKey)
      const amount2 = amount / 10 ** 9
      setGasAccount([puk.publicKey.toString(), amount2.toString()])
      setAnotherWallet(sy)
    } catch {
      setGasAccount(["", ""])
      setAnotherWallet("")
    }
  }

  console.log(selectedItems, "selectedItems----------------------");


  useEffect(() => {
    setGasAccount(["", ""])
  }, [replaceGas])

  const deleteHandle = (index: number) => {
    const indexToRemove = index;
    const newArr = messages.filter((_, index) => index !== indexToRemove);
    setMessages(newArr)
    const newArr2 = data.filter((_, index) => index !== indexToRemove);
    setData(newArr2)
    const newArr3 = walletList.filter((_, index) => index !== indexToRemove);
    setWalletList(newArr3)
    setDeletes(true)
  }
  // const matches = useMediaQuery("(max-width:900px)");

  return (
    <div style={{ padding: matches ? 15 : 30 }}>
      <Page>
        <Flex style={{ alignItems: 'center', justifyContent: "space-between" }}><h2>关闭账户-回收Solana</h2>
          <div >安全提醒，必读！</div>
        </Flex>
        <p style={{ fontSize: matches ? 14 : 16, marginTop: 20 }}>
          Solana上每个Token或NFT都需在首次获取时支付一定的SOL作为账户租金。通过几个简单的步骤，批量销毁您任何不需要的 NFT 或者代币并回收 SOL 租金。<br />

        </p>
        <div> <i>注意：</i>每个地址需0.00001GAS，余额大于0.001SOL才能回收，<ins>推荐使用代付钱包，所有GAS由代付钱包支付</ins> </div>
        <Flex>
          <div className="btn">
            <Button children='导入钱包' onClick={importWallet}></Button>

          </div>

          <div className="btn" style={{ marginLeft: 30 }}>
            <Button children='选中全部' onClick={selectAll}></Button>

          </div>
        </Flex>

        <List>
          {!matches && (
            <table>
              <thead>
                <tr>
                  {head.map((item, index) => (
                    <td key={index}>{item}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {messages.map((item, index) => (
                  <tr key={item.addr || index}>

                    <td><div>
                      <input type="checkbox"
                        checked={item.check}
                        onChange={(e) => { handleCheckboxChange(index, item.addr, !item.check) }} />
                    </div></td>
                    <td>{index + 1}</td>
                    <td style={{ display: "flex", justifyContent: "center", alignItems: 'center' }}>{SliceAddress(item.addr)} </td>
                    <td>{item.all}</td>
                    <td>{item.empty}</td>
                    <td>{Number(item.value).toFixed(4)}</td>
                    <td>{item.state ? "可领取" : "不可领取"}</td>
                    <td ><img onClick={() => deleteHandle(index)} style={{ margin: "0 auto" }} src="/images/delete.png" alt="" /></td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}


          {matches && (
            <>
              {messages.map((item, index) => (
                <div style={{ lineHeight: "30px", borderBottom: '1px solid #4d4d4d', paddingBottom: 10 }}>
                  <div>
                    状态： <input type="checkbox"
                      checked={item.check}
                      onChange={(e) => { handleCheckboxChange(index, item.addr, !item.check) }} />
                  </div>
                  <div> 序号:{index + 1}</div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    钱包地址:{SliceAddress(item.addr)} <div>{item.addr}</div>
                  </div>
                  <div>
                    所有账户:{item.all}
                  </div>
                  <div>
                    空账户:{item.empty}
                  </div>
                  <div>
                    可领取/SOL:{Number(item.value).toFixed(4)}
                  </div>
                  <div>

                    状态：{item.state ? "可领取" : "不可领取"}

                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    操作:

                    <div>
                      <img onClick={() => deleteHandle(index)} style={{ margin: "0 auto" }} src="/images/delete.png" alt="" />
                    </div>
                  </div>

                </div>
              ))}
            </>
          )}
          {data.length === 0 && (
            <Flex style={{ justifyContent: "center", flexDirection: "column", alignItems: "center", margin: '70px 0' }}>
              <div>
                <img src="/newimages/no_data.png" alt="" />
              </div>
              <div style={{ color: "#4d4d4d" }}>No_Data</div>
            </Flex>
          )}
        </List>
        {!matches && (
          <Flex style={{ justifyContent: "space-between", textAlign: "center" }}>
            <li>
              <p>全部账户数量</p>
              <span>
                {sum.all}
              </span>
            </li>
            <li>
              <p>
                全部可领取的SOL
              </p>
              <span>
                {sum.value.toFixed(4)}
              </span>
            </li>
            <li>
              <p>
                选中的账户数量
              </p>
              <span> {sum.selected}</span>
            </li>
            <li>
              <p>
                选中账户可领取的SOL
              </p>
              <span> {sum.selectedValue.toFixed(4)}</span>
            </li>
          </Flex>

        )}
        {matches && (
          <Mobile>
            <Flex >
              <p>全部账户数量:</p>
              <span>
                {sum.all}
              </span>
            </Flex>
            <Flex>
              <p>全部可领取的SOL:</p>
              <span>
                {sum.value.toFixed(4)}
              </span>
            </Flex>

            <Flex>
              <p>选中的账户数量:</p>
              <span>
                {sum.value.toFixed(4)}
              </span>
            </Flex>
            <Flex>
              <p>选中账户可领取的SOL:</p>
              <span>
                {sum.value.toFixed(4)}
              </span>
            </Flex>

          </Mobile>

        )}

        <Flex style={{ lineHeight: "40px" }}>
          <div>代付Gas(推荐)<Tooltip
            title={
              t("通过导入钱包支付所需的GAS费用，轻松解决回收账户中无GAS的问题，让账户租金回收更加便捷。")
            }
            color="cyan"
            placement="top"
          >
            <QuestionCircleOutlined style={{ color: '#fb512d', paddingLeft: '1px' }} />
          </Tooltip>：

          </div>
          <Switch onChange={() => {
            setReplaceGas(!replaceGas)
          }}>
          </Switch>
        </Flex>
        {!matches && (
          <Flex style={{ lineHeight: "40px" }}>

            {replaceGas &&
              <List>
                <table style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ width: 200 }}>私钥</th>
                      <th style={{ width: 200 }}>钱包地址</th>
                      <th style={{ width: 200 }}>SOL余额</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td> <input placeholder="请输入私钥" style={{ width: 200 }} type="text" onChange={(e) => getGasAccount(e.target.value)} /></td>
                      <td> {gasAccount[0] && SliceAddress(gasAccount[0])} </td>
                      <td>{gasAccount[1]}</td>

                    </tr>
                  </tbody>
                </table>
              </List>
            }

          </Flex>
        )}
        {matches && (
          <>
            {replaceGas && (
              <Mobile>

                <>
                  <Flex>
                    私钥:<input placeholder="请输入私钥" style={{ width: 200 }} type="text" onChange={(e) => getGasAccount(e.target.value)} />
                  </Flex>
                  <Flex>钱包地址:{gasAccount[0] && SliceAddress(gasAccount[0])}</Flex>
                  <Flex>SOL余额:{gasAccount[1]}</Flex>
                </>
              </Mobile>
            )}
          </>

        )}

        <div>
          <Flex>
            <div>
              回收SOL到指定地址
            </div>
            <Tooltip
              title={
                t("选择此选项后，所有从账户中回收的 SOL 将直接转移到您指定的钱包地址，无需额外 GAS。请确保您填写的地址准确无误，以避免资产损失。该操作不可逆，请仔细确认地址后再进行操作。")
              }
              color="cyan"
              placement="top"
            >
              <QuestionCircleOutlined style={{ color: '#fb512d', paddingLeft: '1px' }} />
            </Tooltip>
          </Flex>
        </div>
        <Flex>
          <input value={currentWallet} placeholder="回收SOL到指定地址，如不填则回收至对应账户" onChange={(e) => setCurrentWallet(e.target.value)} />
          <div>
            <Button onClick={function (): void {
              if (wallet?.publicKey.toString()) {
                setCurrentWallet(wallet?.publicKey.toString())
              }
            }} children='当前钱包'></Button>
          </div>

        </Flex>
        <div>
          <i>费用：</i>10%的服务费
        </div>
        <div>

          <Button onClick={closeAccount} >回收</Button>
        </div>


      </Page>

    </div >
  )
}

export default App