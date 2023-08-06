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

    win.loadFile('src/index.html');
    //dev tools
    win.webContents.openDevTools();
}

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

// Connect to Python service running on port 7997
function connectToPythonService() {
    let client = new net.Socket();

    client.connect(7997, '127.0.0.1', () => {
        console.log('Connected to Python Service');
    });

    client.on('data', (data) => {
        console.log('Received data from Python service:', data.toString());
    });

    client.on('error', (error) => {
        console.error('Error on the socket:', error, 'Retrying in 3 seconds');
        client.destroy();
        setTimeout(connectToPythonService, 3000);
    });

    client.on('end', () => {
        console.log('Connection ended by the server');
    });

    client.on('close', () => {
        console.log('Connection closed');
    });
    // Listen for control command messages from the renderer process (GUI)
    ipcMain.on('send-command', (event, command) => {
        client.write(JSON.stringify(command));
    });
}



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
    connectToPythonService();
    connectToTelemetryService();
    createWindow();
    
});

