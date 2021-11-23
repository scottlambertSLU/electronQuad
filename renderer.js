console.log( 'loaded renderer.js' );
const electron = require( 'electron' );
const ipcRenderer = require( 'electron' ).ipcRenderer;

// styling for the simulation iframe
let frame = document.getElementById( "iframe" );
frame.style.width = '800px';
frame.style.height = '600px';

// references to the simulation model and other global libraries that will be defined
// once the iframe and PhET context loads
let dot;
let simulationModel;

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

  if ( data.type === 'load' ) {

    const simFrameWindow = document.getElementById( "iframe" ).contentWindow;

    // the simulation has successfully loaded, we should have access to globals
    dot = simFrameWindow.phet.dot;
    simulationModel = simFrameWindow.simModel;

    const vertex1 = simFrameWindow.vertex1;
    const vertex2 = simFrameWindow.vertex2;
    const vertex3 = simFrameWindow.vertex3;
    const vertex4 = simFrameWindow.vertex4;

    // now that we have references, add listeners to the main process to handle data
    ipcRenderer.on( 'asynchronous-message', message => {
      const parsedData = JSON.parse( message );

      const angle1 = pdata.angle1;
      const angle2 = pdata.angle2;
      const angle3 = pdata.angle3;
      const angle4 = pdata.angle4;

      const lengthA = pdata.lengthA;
      const lengthB = pdata.lengthB;
      const lengthC = pdata.lengthC;
      const lengthD = pdata.lengthD;

      console.log( angle1 );

      // if ( simulationModel.isCalibratingProperty.value ) {
      //   simulationModel.setPhysicalModelBounds( lengthC, lengthB, lengthA, lengthD );
      // }
      //
      // simModel.setPositionsFromLengthAndAngleData( lengthC, lengthB, lengthA, lengthD, angle1, angle4, angle2, angle3 );
    } );
  }
} );