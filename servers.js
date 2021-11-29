/**
 * Implements servers used for the applicaiotn. Includes an http servat that serves the simulation
 * and facilitates communication through it. Also creates a socket.io server with websockets to
 * support communication between Serial APIs and the simulation.
 *
 * This is in a separate file because for Electron we need to use it in child process to send messages
 * with ipcRenderer between the preload.js and main.js processes.
 */
const SerialPort = require( 'serialport' );
const http = require( 'http' );
const fs = require( 'fs' );
const ioClient = require( 'socket.io-client' );
const ServerMessages = require( './ServerMessages.js' );
const _ = require( 'lodash' );

const parsers = SerialPort.parsers;
const simulationFile = fs.readFileSync( 'quadrilateral_en_adapted-from-phet.html' );

// http server that will both load the simulation html and act as a server for socket.io.
const serverApp = http.createServer( ( req, res ) => {
  res.end( simulationFile );
} );

// use websockets to facilitate communcation between serialport and the simulation
const io = require( 'socket.io' )( serverApp, {
  cors: {
    origin: "http://localhost:3000",
    methods: [ "GET", "POST" ],
    transports: [ 'websocket', 'polling' ],
    credentials: true
  },
  allowEIO3: true
} );

const parser = new parsers.Readline( {
  delimiter: '\r\n'
} );

let openedPort = null;

// A list of devices - we will poll the system and whenever there is a change in
// devices we will update this list and notify the parent process.
let devices = [];

// Search the system for new devices at an interval
setInterval( () => {
  SerialPort.list().then(
    ports => ports.forEach( port => {
      if ( !_.isEqual( ports, devices ) ) {
        devices = ports;

        // tell the parent process that the list of available devices has changed
        sendMessageToProcess( ServerMessages.DEVICES_CHANGED, devices );
      }
    } ) );
}, 5000 );

const socketClient = ioClient( 'http://localhost:3000' );

// The SerialPort uses parser read and then emit formatted data. When we get a 'data' event
// from the parser, emit that with the websocket so that clients can receive.
parser.on( 'data', function( data ) {
  //console.log(data);
  socketClient.emit( 'message', data );
} );

// on socket.io connection, add listeners to the socket to handle data
io.on( 'connection', ( socket ) => {
  console.log( 'connected' );

  socket.on( "message", ( data ) => {

    // for debugging, this will print data to the console
    console.log( data )

    // this will send the data back to the parent process
    // TODO: Do we need this? Could we just send a message to the parent process from parser.on?
    sendMessageToProcess( ServerMessages.SOCKET_IO, data );
  } )
} );

// start listening to the provided port
serverApp.listen( 3000 );

// Listen to messages from the parent process (such as requesting connection to a new device).
process.on( 'message', message => {

  // connection to a new device has been requested, set up a new SerialPort
  if ( message.messageType === ServerMessages.DEVICE_SELECTED ) {

    // close the old connection
    openedPort && openedPort.close();
    openedPort = null;

    if ( message.messageContent !== 'NONE' ) {

      // Create the new SerialPort - the messageContent contains the path to the device for the SerialPort
      // TODO: How do we close/dispose??
      openedPort = new SerialPort( message.messageContent, err => {
          if ( err ) {
            return console.log( 'Error: ', err.message );
          }
        },
        {
          baudRate: 9600,
          dataBits: 8,
          parity: 'none',
          stopBits: 1,
          flowControl: false
        }
      );
      openedPort.pipe( parser );

      console.log( 'Connected new SerialPort to device.' );

      // TODO: This is untested.
      // TODO: I don't see a way to remove the listeners, hopefully they are removed by SerialPort internals
      const closeCallback = () => {
        sendMessageToProcess( ServerMessages.DEVICE_SELECTED, false );
      };
      openedPort.on( 'close', closeCallback );
      openedPort.on( 'error', closeCallback );
    }

    // send a message to the main process that a connection has either been constructed or
    // destroyed
    sendMessageToProcess( ServerMessages.DEVICE_SELECTED, !!openedPort )
  }
} );

/**
 * Send a message to the parent Node.js process.
 * @param {string} messageType, determines how the parent process should handle.
 * @param {*} messageContent
 */
const sendMessageToProcess = ( messageType, messageContent ) => {
  process.send( {
    messageType: messageType,
    messageContent: messageContent
  } );
};