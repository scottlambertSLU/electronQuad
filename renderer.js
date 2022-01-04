const electron = require( 'electron' );
const ipcRenderer = require( 'electron' ).ipcRenderer;
const ServerMessages = require( './ServerMessages.js' );
const _ = require( 'lodash' );

const floatContainerStyle = {
  width: "100%"
}

const leftChildStyle = {
  width: "75%",
  height: "600px",
  float: "left"
};

const rightChildStyle = {
  marginLeft: "25%",
  height: "600px"
}

const dotStyle = {
  width: '25px',
  height: '25px',
  margin: '5px',
  backgroundColor: '#bbb',
  borderRadius: '50%',
  display: 'inline-block',
  verticalAlign: 'middle'
}

const statusReadoutStyle = {
  'marginLeft': '5px',
  verticalAlign: 'middle'
}

const listItemStyle = {
  listStylePosition: 'inside'
};

const SUCCESS_COLOR = '#00AB66';
const FAILURE_COLOR = '#FC100D';

/**
 * Apply the styles defined in a styleObject to the provided element. For some reason, inline
 * CSS is not allowed by electron so we apply it manually in javascript as a workaround.
 * @param element
 * @param styleObject
 */
const applyStyles = ( element, styleObject ) => {
  for ( style in styleObject ) {
    element.style[ style ] = styleObject[ style ];
  }
};

let container = document.getElementById( 'float-container' );
let frame = document.getElementById( "iframe" );
let readout = document.getElementById( 'data-container' );

applyStyles( container, floatContainerStyle );
applyStyles( frame, leftChildStyle );
applyStyles( readout, rightChildStyle );

_.forEach( document.getElementsByClassName( 'dot' ), dotElement => {
  applyStyles( dotElement, dotStyle );
} );

_.forEach( document.getElementsByClassName( 'statusReadout' ), statusElement => {
  applyStyles( statusElement, statusReadoutStyle );
} );

_.forEach( document.getElementsByTagName( 'li' ), listItemElement => {
  applyStyles( listItemElement, listItemStyle );
} );

// references to the simulation model and other global libraries that will be defined
// once the iframe and PhET context loads
let dot;
let simulationModel;

const badDataDotElement = document.getElementById( 'bad-data-dot' );
const dataDotElement = document.getElementById( 'data-dot' );

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

    /**
     * Use dot to format a value for easy readout.
     * @param value
     * @return {*|string}
     */
    const formatValue = value => {
      return dot.Utils.toFixed( value, 2 );
    }

    // now that we have references, add listeners to the main process to handle data
    ipcRenderer.on( 'asynchronous-message', ( message, data ) => {
      const dataContent = JSON.parse( data.messageContent );
      const messageType = data.messageType;

      let dataList = [];

      if ( messageType === ServerMessages.SOCKET_IO ) {

        // angle data, converted to radians
        const angle1 = dot.Utils.toRadians( dataContent.angle1 );
        const angle2 = dot.Utils.toRadians( dataContent.angle2 );
        const angle3 = dot.Utils.toRadians( dataContent.angle3 );
        const angle4 = dot.Utils.toRadians( dataContent.angle4 );

        const lengthA = dataContent.lengthA;
        const lengthB = dataContent.lengthB;
        const lengthC = dataContent.lengthC;
        const lengthD = dataContent.lengthD;

        if ( simulationModel.isCalibratingProperty.value ) {

          // top, right, bottom, left sides
          simulationModel.setPhysicalModelBounds( lengthD, lengthC, lengthB, lengthA );
        }

        // top, right, bottom, left sides then leftTop, rightTop, rightBottom, leftBottom sides
        simulationModel.quadrilateralShapeModel.setPositionsFromLengthAndAngleData( lengthD, lengthC, lengthB, lengthA, angle1, angle4, angle3, angle2 );

        // if any are null, report that there is potentially bad data being sent to the sim
        // TODO: Could make this better, catching more things
        dataList = [
          angle1, angle2, angle3, angle4, lengthA, lengthB, lengthC, lengthD
        ]

        // populate the readouts with values for debugging
        document.getElementById( "top-side-readout" ).innerText = `Top Side: ${formatValue( lengthD )}`;
        document.getElementById( "right-side-readout" ).innerText = `Right Side: ${formatValue( lengthC )}`;
        document.getElementById( "bottom-side-readout" ).innerText = `Bottom Side: ${formatValue( lengthB )}`;
        document.getElementById( "left-side-readout" ).innerText = `Left Side: ${formatValue( lengthA )}`;

        document.getElementById( "left-top-angle-readout" ).innerText = `Left top angle: ${formatValue( angle1 )}`;
        document.getElementById( "right-top-angle-readout" ).innerText = `Right top angle:${formatValue( angle4 )}`;
        document.getElementById( "right-bottom-angle-readout" ).innerText = `Right bottom angle: ${formatValue( angle3 )}`;
        document.getElementById( "left-bottom-angle-readout" ).innerText = `Left bottom angle: ${formatValue( angle2 )}`;
      }

      const dataReceived = dataList.length > 0;
      const allDataGood = !_.some( dataList, data => data === null );

      dataDotElement.style.backgroundColor = dataReceived ? SUCCESS_COLOR : FAILURE_COLOR;
      badDataDotElement.style.backgroundColor = ( allDataGood && dataReceived ) ? SUCCESS_COLOR : FAILURE_COLOR;

    } );
  }
} );

// Listen for messages from the main process that do not require the simulation (and need to be
// available on load
ipcRenderer.on( 'asynchronous-message', ( message, data ) => {
  const dataContent = data.messageContent;
  const messageType = data.messageType;

  if ( messageType === ServerMessages.DEVICES_CHANGED ) {
    const selectElement = document.getElementById( 'devices' );

    // quick way to remove all previous children
    selectElement.innerHTML = "";

    // a default "none" option
    const noneOption = document.createElement( 'option' );
    noneOption.textContent = 'No device';
    noneOption.value = 'NONE';
    selectElement.appendChild( noneOption );

    // Iterate over each device, and create a new UI component to select it.
    dataContent.forEach( device => {
      const selectOption = document.createElement( 'option' );
      selectOption.value = device.path;
      selectOption.textContent = `${device.manufacturer}, ${device.path}`;
      selectElement.appendChild( selectOption );
    } );
  }
  else if ( messageType === ServerMessages.DEVICE_SELECTED ) {

    // a new device has been connected with the UI
    const color = dataContent ? SUCCESS_COLOR : FAILURE_COLOR;
    document.getElementById( 'connection-dot' ).style.backgroundColor = color;
  }
} );

// When the select option chooses a new device, send a message to the server process to
// set up a new SerialPort
const selectElement = document.getElementById( 'devices' );
selectElement.addEventListener( 'change', event => {

  const selectedPath = selectElement.options[ selectElement.selectedIndex ].value;
  ipcRenderer.send( 'asynchronous-message', {
    messageType: ServerMessages.DEVICE_SELECTED,
    messageContent: selectedPath
  } );
} );