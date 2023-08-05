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

function sendCommand() {
    let sugarSpeed = document.getElementById('sugar-speed').value;
    let butterPump = document.getElementById('butter-pump').checked ? 1 : 0;
    let milkPump = document.getElementById('milk-pump').checked ? 1 : 0;
    let mixerEnable = document.getElementById('mixer-enable').checked ? 1 : 0;

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
    document.getElementById('timer').innerText = `Mix Timer: ${data.timer}`;
    document.getElementById('weight').innerText = `Mixer Weight: ${data.weight} lbs`;
    document.getElementById('sugar-butter-ratio').innerText = `Sugar to Butter Ratio: ${data.sugarButterRatio}`;
    document.getElementById('mix-milk-ratio').innerText = `Sugar/Butter Mix to Milk Ratio: ${data.mixMilkRatio}`;
});
