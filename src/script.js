const { ipcRenderer } = require('electron');

let mixerRunning = false;
let mixStartTime;
let mixTimerInterval;
let sugarSpeed = 0;

let historicalSugarWeight = 0;
let historicalButterWeight = 0;
let historicalMilkWeight = 0;

// Helper to update UI text
function updateUI(elementId, text) {
    document.getElementById(elementId).innerText = text;
}

// Attach event listeners for pump changes
['butter-pump', 'milk-pump'].forEach(id => {
    document.getElementById(id).addEventListener('change', function () {
        if (id === 'butter-pump' && document.getElementById(id).checked) {
            document.getElementById('milk-pump').disabled = true;
        } else if (id === 'butter-pump' && !document.getElementById(id).checked) {
            document.getElementById('milk-pump').disabled = false;
        }
        sendCommand();
    });
});

document.getElementById('mixer-enable').addEventListener('change', function () {
    if (document.getElementById('mixer-enable').checked && !mixerRunning) {
        startMixTimer();
        mixerRunning = true;
    } else if (!document.getElementById('mixer-enable').checked && mixerRunning) {
        stopMixTimer();
        mixerRunning = false;
    }
    sendCommand();
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
        calculateAndDisplayRatios();  // Ensure the ratio is updated when sugar speed changes
    }
}

function calculateAndDisplayRatios() {
    let sugarButterRatio;
    let mixMilkRatio;

    if (historicalButterWeight === 0) {
        sugarButterRatio = "Undefined (No butter added)";
    } else {
        sugarButterRatio = (historicalSugarWeight / historicalButterWeight).toFixed(2);
    }

    if (historicalMilkWeight === 0) {
        mixMilkRatio = "Undefined (No milk added)";
    } else {
        mixMilkRatio = ((historicalSugarWeight + historicalButterWeight) / historicalMilkWeight).toFixed(2);
    }

    updateUI('sugar-butter-ratio', `Sugar to Butter Ratio: ${sugarButterRatio}`);
    updateUI('mix-milk-ratio', `Sugar/Butter Mix to Milk Ratio: ${mixMilkRatio}`);
}

function updateHistoricalWeights() {
    if (sugarSpeed > 0) {
        historicalSugarWeight += sugarSpeed * 0.05;
    }
    if (document.getElementById('butter-pump').checked) {
        historicalButterWeight += 0.13;
    }
    if (document.getElementById('milk-pump').checked) {
        historicalMilkWeight += 0.05;
    }
    calculateAndDisplayRatios();  // Call the function here
}


function startMixTimer() {
    mixStartTime = new Date().getTime();
    mixTimerInterval = setInterval(updateMixTimer, 1000);
}

function stopMixTimer() {
    clearInterval(mixTimerInterval);
    updateUI('timer', `Mix Timer: 0 seconds`); // Reset the displayed timer value
}

function updateMixTimer() {
    const elapsedTime = Math.floor((new Date().getTime() - mixStartTime) / 1000);
    if (!isNaN(elapsedTime)) {
        updateUI('timer', `Mix Timer: ${elapsedTime} seconds`);
    }
}

function updateStatesAndTimer() {
    const mixerEnable = document.getElementById('mixer-enable').checked ? 1 : 0;

    if (mixerEnable && !mixerRunning) {
        startMixTimer();
        mixerRunning = true;
    } else if (!mixerEnable && mixerRunning) {
        stopMixTimer();
        mixerRunning = false;
    }

    return { mixerEnable }; 
}

function sendCommand() {
    const butterPump = document.getElementById('butter-pump').checked ? 1 : 0;
    const milkPump = document.getElementById('milk-pump').checked ? 1 : 0;
    const { mixerEnable } = updateStatesAndTimer();  // Update timer status based on mixer state

    ipcRenderer.send('send-command', {
        SgrDisp: sugarSpeed,
        BttrPmp: butterPump,
        MlkPmp: milkPump,
        MXR: mixerEnable
    });
}

function sendCommand() {
    const butterPump = document.getElementById('butter-pump').checked ? 1 : 0;
    const milkPump = document.getElementById('milk-pump').checked ? 1 : 0;
    const mixerEnable = document.getElementById('mixer-enable').checked ? 1 : 0;

    ipcRenderer.send('send-command', {
        SgrDisp: sugarSpeed,
        BttrPmp: butterPump,
        MlkPmp: milkPump,
        MXR: mixerEnable
    });
}

ipcRenderer.on('receive-telemetry', (event, data) => {
    updateUI('weight', `Mixer Weight: ${data.MXR_LBS} lbs`);
    updateHistoricalWeights();
    calculateAndDisplayRatios();  // Ensure the ratio updates when telemetry data is received
});
