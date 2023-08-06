const { ipcRenderer } = require('electron');

let mixerRunning = false;
let mixStartTime;
let mixTimerInterval;
let sugarSpeed = 0;

const rightRecipeSugToBud = {
    sugar: 9,
    butter: 1,
    blendTime: 60
}

const rightRecipeMixToMilk = {
    sugBudMix: 58,
    milk: 1,
    blendTime: 60
}

// Helper to update UI text
function updateUI(elementId, text) {
    document.getElementById(elementId).innerText = text;
}

// Attach event listeners for pump changes
['butter-pump', 'milk-pump', 'mixer-enable'].forEach(id => {
    document.getElementById(id).addEventListener('change', sendCommand);
});

// Increase & Decrease sugar speed
document.getElementById('increase-speed').addEventListener('click', function () {
    adjustSugarSpeed(1);
});

document.getElementById('decrease-speed').addEventListener('click', function () {
    adjustSugarSpeed(-1);
});

function adjustSugarSpeed(adjustment) {
    if ((sugarSpeed + adjustment) >= 0 && (sugarSpeed + adjustment) <= 5) {
        sugarSpeed += adjustment;
        updateUI('sugar-speed', sugarSpeed);
        sendCommand();
    }
}

function startMixTimer() {
    mixStartTime = new Date().getTime();
    mixTimerInterval = setInterval(updateMixTimer, 1000);
}

function stopMixTimer() {
    clearInterval(mixTimerInterval);
}

function updateMixTimer() {
    const elapsedTime = Math.floor((new Date().getTime() - mixStartTime) / 1000);

    if (!isNaN(elapsedTime)) {
        updateUI('timer', `Mix Timer: ${elapsedTime} seconds`);
    }
}


function updateStatesAndTimer() {
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

    return { butterPump, milkPump, mixerEnable };
}

function sendCommand() {
    const { butterPump, milkPump, mixerEnable } = updateStatesAndTimer();

    ipcRenderer.send('send-command', {
        SgrDisp: sugarSpeed,
        BttrPmp: butterPump,
        MlkPmp: milkPump,
        MXR: mixerEnable
    });
}

ipcRenderer.on('receive-telemetry', (event, data) => {

    updateUI('weight', `Mixer Weight: ${data.MXR_LBS} lbs`);
});
