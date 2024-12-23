import { Connection } from "@solana/web3.js";
import { message } from "antd";

export async function confirmTransaction(connection: Connection, signature: string) {

    let confirmed = false;
    let timeout = 0;
    while (!confirmed && timeout < 10000) {
        await new Promise(r => setTimeout(r, 500));
        let status = await connection.getSignatureStatuses([signature]);
        console.log(status)
        if (status.value[0]?.confirmationStatus == "confirmed") {
            console.log({ type: 'success', message: `Success!`, txid: signature })
            confirmed = true;
        }
        else {
            timeout += 500;
        }
    }

    if (timeout == 1000) {
        console.log({ type: 'error', message: `Tx timed-out. Try again` })
    }
    return
}