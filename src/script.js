const { ipcRenderer } = require('electron');

const elements = [
    'sugar-speed',
    'butter-pump',
    'milk-pump',
    'mixer-enable'
];

elements.forEach((element) => {
    document.getElementById(element).addEventListener('change', sendCommand);
});

let mixerRunning = false;
let mixStartTime;
let mixTimerInterval;

function startMixTimer() {
    mixStartTime = new Date().getTime();
    mixTimerInterval = setInterval(updateMixTimer, 1000);
}

function stopMixTimer() {
    clearInterval(mixTimerInterval);
}

function updateMixTimer() {
    const currentTime = new Date().getTime();
    const elapsedTime = Math.floor((currentTime - mixStartTime) / 1000);
    document.getElementById('timer').innerText = `Mix Timer: ${elapsedTime} seconds`;
}

function sendCommand() {
    let sugarSpeed = document.getElementById('sugar-speed').value;
    let butterPump = document.getElementById('butter-pump').checked ? 1 : 0;
    let milkPump = document.getElementById('milk-pump').checked ? 1 : 0;
    let mixerEnable = document.getElementById('mixer-enable').checked ? 1 : 0;

    if (mixerEnable && !mixerRunning) {
        startMixTimer();
        mixerRunning = true;
    } else if (!mixerEnable && mixerRunning) {
        stopMixTimer();
        mixerRunning = false;
    }

    // Send the control commands to the main process
    ipcRenderer.send('send-command', {
        SgrDisp: sugarSpeed,
        BttrPmp: butterPump,
        MlkPmp: milkPump,
        MXR: mixerEnable
    });
}

// Receive the telemetry data from the main process
ipcRenderer.on('receive-telemetry', (event, data) => {
    document.getElementById('timer').innerText = `Mix Timer: ${data.MXR} seconds`;
    document.getElementById('weight').innerText = `Mixer Weight: ${data.MXR_LBS} lbs`;
    document.getElementById('sugar-butter-ratio').innerText = `Sugar to Butter Ratio: ${data.SgrRatio}`;
    document.getElementById('mix-milk-ratio').innerText = `Sugar/Butter Mix to Milk Ratio: ${data.MixMilkRatio}`;
});
