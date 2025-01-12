let isRunning = true;

self.onmessage = (event: MessageEvent) => {
    const { task, data, interval } = event.data;
    if (task === 'CLOSE') {
        isRunning = false;
        self.close();
        return;
    }
    console.log('Worker receive:', task);
    sx(task, data, interval)
};

async function sx(task: number, data: number, interval: string[]) {
    const sleepTime = Math.floor(Math.random() * (Number(interval[2]) * 1000 - Number(interval[1]) * 1000 + 1)) + Number(interval[1]) * 1000;
    while (true) {
        const randomNum = Math.floor(Math.random() * data);
        postMessage({ task: task, data: randomNum });
        await delay(sleepTime);
    }
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

