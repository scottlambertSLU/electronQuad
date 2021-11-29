const { app, BrowserWindow, ipcMain } = require( 'electron' );
const path = require( 'path' );
const ServerMessages = require( './ServerMessages.js' );

// Global environment variables that can be used in preload.js
process.env.SOCKET_PORT = 3000;

// launches the servers in a child process so that we can send messages
// between main and preload processes
const { fork } = require( 'child_process' );
const serverProcess = fork( `${__dirname}/servers.js` );

const createWindow = () => {

  // Create the browser window.
  const mainWindow = new BrowserWindow( {
    width: 1020,
    height: 800,
    webPreferences: {

      // TODO: This allows the preload to access the same window as the
      // one used in the simulation iframe. Otherwise, it uses a new
      // window instance without any of the globals defined by the sim.
      // Electron strongly recommends contextIsolation: true for security
      // reasons. Come back to this. See
      // https://www.electronjs.org/docs/latest/tutorial/context-isolation
      contextIsolation: false,

      // Enabling this allows us to use Node.js in the renderer.js file, which we
      // need to handle messages
      nodeIntegration: true,
      preload: path.join( __dirname, 'preload.js' )
    }
  } )

  // and load the index.html of the app.
  mainWindow.loadFile( 'index.html' )

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Handle messages that we receive from the child process
  serverProcess.on( 'message', message => {
    if ( message.messageType === ServerMessages.SOCKET_IO ) {

      // a socket.io messages was received containing data, send this along to the
      // renderer
      mainWindow.webContents.send( 'asynchronous-message', message );
    }
    else if ( message.messageType === ServerMessages.DEVICES_CHANGED ) {
      mainWindow.webContents.send( 'asynchronous-message', message );
    }
    else if ( message.messageType === ServerMessages.DEVICE_SELECTED ) {
      mainWindow.webContents.send( 'asynchronous-message', message )
    }
  } );

  mainWindow.webContents.send( 'asynchronous-message', 'This is a test message to the renderer process.' );

  // receive messages from child processes
  ipcMain.on( 'asynchronous-message', ( event, message ) => {

    // received a request to change device, forward this to the server process
    if ( message.messageType === ServerMessages.DEVICE_SELECTED ) {
      serverProcess.send( message );
    }
  } );
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then( () => {
  createWindow()

  app.on( 'activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if ( BrowserWindow.getAllWindows().length === 0 ) {
      createWindow()
    }
  } )
} )

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on( 'window-all-closed', () => {
  if ( process.platform !== 'darwin' ) {
    app.quit()
  }
} )

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.