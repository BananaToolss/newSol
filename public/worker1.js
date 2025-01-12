
onmessage = async function (event) {
    const { eventName, total, thread, threadIndex, spaceTime } = event.data;
    // if (eventName === 'CLOSE') {
    //     self.close();
    //     return;
    // }
    console.log(e, 'event')
    postMessage({ k: 1 })

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

// function delay(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

