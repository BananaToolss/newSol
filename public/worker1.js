
onmessage = async function (event) {
    // console.log(event.data, 'event.data')
    const { eventName, total, threadIndex, spaceTime } = event.data;
    for (let index = threadIndex * total; index < (threadIndex + 1) * total; index++) {
        postMessage({ walletIndex: index, threadIndex })
        // await delay(spaceTime);
    }
}
// self.onmessage = (event) => {
//     const { eventName, total, thread, threadIndex, spaceTime } = event.data;
//     if (eventName === 'CLOSE') {
//         self.close();
//         return;
//     }
//     console.log(event, 'event')
//     // console.log('Worker receive:', task);
//     // sx(task, data, interval)
// };

// async function sx(task, data, interval) {
//     const sleepTime = Math.floor(Math.random() * (Number(interval[2]) * 1000 - Number(interval[1]) * 1000 + 1)) + Number(interval[1]) * 1000;
//     while (true) {
//         const randomNum = Math.floor(Math.random() * data);
//         postMessage({ task: task, data: randomNum });
//         await delay(sleepTime);
//     }
// }

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

