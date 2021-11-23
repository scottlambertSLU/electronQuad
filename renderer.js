console.log( 'loaded renderer.js' );
const electron = require( 'electron' );
const ipcRenderer = require( 'electron' ).ipcRenderer;

// styling for the simulation iframe
let frame = document.getElementById( "iframe" );
frame.style.width = '800px';
frame.style.height = '600px';

window.addEventListener( 'message', event => {
  if ( !event.data ) {
    return;
  }

  let data;
  try {
    data = JSON.parse( event.data );
  }
  catch( e ) {
    return;
  }
} );

ipcRenderer.on( 'asynchronous-message', message => {
  console.log( 'received data from the main process' )
} );