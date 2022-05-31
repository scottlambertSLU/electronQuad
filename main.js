const { app, BrowserWindow, ipcMain } = require( 'electron' );
const path = require( 'path' );
const ServerMessages = require( './ServerMessages.js' );

// I used to have these in a child process using fork, but I could not get that to work with electron-forge. Instead
// we are hacking it together with a listener pattern.
const { sendMessageToServers, addServerMessageListener } = require( './servers.js' );

// Global environment variables that can be used in preload.js
process.env.SOCKET_PORT = 3000;

const createWindow = () => {

  // Create the browser window.
  const mainWindow = new BrowserWindow( {
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
  } );

  // Instead of using width, height options to BrowserWindow, make it take the full screen
  mainWindow.maximize();

  // and load the index.html of the app.
  mainWindow.loadFile( 'index.html' )

  // Open the DevTools for debugging
  mainWindow.webContents.openDevTools();

  // Handle messages that we receive from the child process
  addServerMessageListener( message => {

    console.log( 'receiving message from addServerMessageListener' );
    if ( message.messageType === ServerMessages.SOCKET_IO ) {
      console.log( 'socket message' );

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
      sendMessageToServers( message );
    }
  } );

  // a load (or reload) was detected, we are going to eagerly update the
  mainWindow.webContents.on( 'did-finish-load', ( e ) => {
    sendMessageToServers( {
      messageType: ServerMessages.APP_FINISH_LOAD,
      messageContent: true
    } );
  } );

  mainWindow.on( 'close', ( e ) => {
    sendMessageToServers( {
      messageType: ServerMessages.APP_CLOSING,
      messageContent: true
    } )
  } );
}

// allow going through https to phet-dev
app.commandLine.appendSwitch( 'disable-site-isolation-trials' )

// This is how Electron will process the login request from PhET's servers for login credentials.
app.on( "login", ( event, webContents, request, authInfo, callback ) => {
  event.preventDefault();

  // No good - would be best to have a our own credentials dialog to enter this but I ran out of steam
  // trying to get that to work. See https://stackoverflow.com/questions/43311513/whats-the-proper-way-to-handle-forms-in-electron
  callback( 'phet', 'chime7' );
} );

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
} );

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
//
// This section was added by electron boilerplate. But it is causing crashing issues when connecting to the device
// after closing while the app stays "active" in the background. Removing this means that closing the window does
// a hard close on macOS (though apparently that is not conventional).
//
// app.on( 'window-all-closed', () => {
//   if ( process.platform !== 'darwin' ) {
//     app.quit()
//   }
// } )

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.