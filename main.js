const { app, BrowserWindow, ipcMain } = require('electron');
const net = require('net');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});

// Listen for control command messages from the renderer process (GUI)
ipcMain.on('send-command', (event, command) => {
    // Send the command to your Python service running on port 7997
    let client = new net.Socket();
    client.connect(7997, '127.0.0.1', () => {
        client.write(JSON.stringify(command));
        client.destroy();
    });
});

// Function to handle the telemetry connection
function connectToTelemetryService() {
    let telemetryClient = new net.Socket();

    telemetryClient.connect(7887, '127.0.0.1', () => {
        console.log('Connected to telemetry service');
    });

    telemetryClient.on('error', (error) => {
        console.error('Error connecting to telemetry service. Retrying in 3 seconds...');
        telemetryClient.destroy();
        setTimeout(connectToTelemetryService, 3000);
    });

    telemetryClient.on('data', (data) => {
        try {
            let telemetryData = JSON.parse(data);
            win.webContents.send('receive-telemetry', telemetryData);
        } catch (error) {
            console.error('Error parsing telemetry data:', error);
        }
    });

    telemetryClient.on('close', () => {
        console.log('Telemetry connection closed');
    });
}

app.whenReady().then(() => {
    createWindow();
    connectToTelemetryService();
});

