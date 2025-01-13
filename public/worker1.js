
onmessage = async function (event) {
    // console.log(event.data, 'event.data')
    const { eventName, total, threadIndex, spaceTime } = event.data;
    start(threadIndex, total, threadIndex, spaceTime)
}

async function start(threadIndex, total, threadIndex, spaceTime) {
    for (let index = threadIndex * total; index < (threadIndex + 1) * total; index++) {
        postMessage({ walletIndex: index, threadIndex })
        await delay(spaceTime);
    }
    start(threadIndex, total, threadIndex, spaceTime)
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

