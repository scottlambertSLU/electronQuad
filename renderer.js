console.log( 'loaded renderer.js' );
const electron = require( 'electron' );
const ipcRenderer = require( 'electron' ).ipcRenderer;

const floatContainerStyle = {
  width: "100%"
}

const leftChildStyle = {
  width: "50%",
  height: "600px",
  float: "left",
  // padding: "20p",
  // border: "2px solid red",
};

const rightChildStyle = {
  marginLeft: "50%",
  height: "600px"
}

/**
 * Apply the styles defined in a styleObject to the provided element. For some reason, inline
 * CSS is not allowed by electron so we apply it manually in javascript as a workaround.
 * @param element
 * @param styleObject
 */
const applyStyles = ( element, styleObject ) => {
  for ( style in styleObject ) {
    console.log( style)
    element.style[ style ] = styleObject[ style ];
  }
};

let container = document.getElementById( 'float-container' );
let frame = document.getElementById( "iframe" );
let readout = document.getElementById( 'data-container' );
let simulationContainer = document.getElementById( 'simulation-container' );

applyStyles( container, floatContainerStyle );
applyStyles( frame, leftChildStyle );
applyStyles( readout, rightChildStyle );

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
    ipcRenderer.on( 'asynchronous-message', ( message, data ) => {
      const parsedData = JSON.parse( data );

      const angle1 = parsedData.angle1;
      const angle2 = parsedData.angle2;
      const angle3 = parsedData.angle3;
      const angle4 = parsedData.angle4;

      const lengthA = parsedData.lengthA;
      const lengthB = parsedData.lengthB;
      const lengthC = parsedData.lengthC;
      const lengthD = parsedData.lengthD;

      console.log( angle1 );

      if ( simulationModel.isCalibratingProperty.value ) {
        simulationModel.setPhysicalModelBounds( lengthC, lengthB, lengthA, lengthD );
      }

      simulationModel.setPositionsFromLengthAndAngleData( lengthC, lengthB, lengthA, lengthD, angle1, angle4, angle2, angle3 );
    } );
  }
} );