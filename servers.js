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

SerialPort.list().then(
  ports => ports.forEach( port => {
    console.log( port.manufacturer );
    if ( port.manufacturer && port.manufacturer.includes( 'arduino' ) ) {
      openedPort = new SerialPort( port.path, err => {
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
    }
  } ) );


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

// websocket client - connect
socketClient.emit( 'message', 'This is the data' );


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