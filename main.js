const { app, BrowserWindow } = require('electron');
var http = require('http');
var fs = require('fs');
const path = require('path');
var SerialPort = require('serialport');
const parsers = SerialPort.parsers;

var simulationFile = fs.readFileSync( 'quadrilateral_en_adapted-from-phet.html');

const parser = new parsers.Readline({
    delimiter: '\r\n'
});  

SerialPort.list().then (
    ports=>ports.forEach(port => {
     if (port.manufacturer && port.manufacturer.includes('arduino')) {
      console.log(port);
      openedPort = new SerialPort(port.path, err => {
       if (err) {
        return console.log('Error: ', err.message);
       }
       openedPort.pipe(parser);
      },
    {
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false
    }

    )}
}));


var serverApp = http.createServer(function(req, res) {
    console.log(req.url);
    res.end(simulationFile);
    /*
    if (req.url === '/') {
  
    res.writeHead(200, {'Content-Type': 'text/html'});
    //res.end(index);
  
    }
    else {
      res.writeHead(200, {'Content-Type': 'text/html'});
  
      //res.end(index2);
    } */
});


const io = require('socket.io')(serverApp, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});



parser.on('data', function(data) {

io.emit('data', data);
    
});

io.on('connection', (socket) => {
    console.log('connected');

    socket.on("message", (data)=>{
        console.log(data)
    })
});



serverApp.listen(3000);


const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    })
  
    // and load the index.html of the app.
    mainWindow.loadFile('index.html')
  
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
  }
  
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
  
  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
  
  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and require them here.