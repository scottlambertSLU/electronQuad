const electron = require( 'electron' );
const ipcRenderer = require( 'electron' ).ipcRenderer;
const ServerMessages = require( './ServerMessages.js' );
const _ = require( 'lodash' );

// Set to true to point the simulation to the phet-io metacog wrapper
const DATA_COLLECTION = true;

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

const SUCCESS_TEXT_COLOR = 'black';
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

const defaultConnectionQueries = 'postMessageOnLoad&postMessageOnError&deviceConnection&markerInput';
const defaultModelQueries = 'deviceShapeAngleToleranceInterval=0.05&deviceShapeLengthToleranceInterval=0.03&toleranceIntervalScaleFactor=10';

let phetioQueries;

let simulationSource;
if ( DATA_COLLECTION ) {
  simulationSource = 'https://phet-dev.colorado.edu/html/quadrilateral/1.0.0-dev.36/phet-io/wrappers/login/'; // metacog wrapper
  phetioQueries = 'numberOfDigits=4&wrapper=record&validationRule=validateDigits&metacog&publisher_id=5d4c8ae1&key_name=phet-quad-study_2022_q3&widget_id=phet-quad-study_2022_q3-test&phetioEmitStates=true&phetioEmitStatesInterval=60';
}
else {
  simulationSource = 'quadrilateral_en_phet.html';
  phetioQueries = '';
}

// Set to the simulation
frame.src = `${simulationSource}?${defaultConnectionQueries}&${defaultModelQueries}&${phetioQueries}`;

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

const addReadyListenerToParentWindow = ( parentWindow, simFrameWindow ) => {
  parentWindow.addEventListener( 'message', event => {
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
        let allDataGood = false;

        if ( messageType === ServerMessages.SOCKET_IO ) {


          // angle data, converted to radians
          const angle1 = dot.Utils.toRadians( dataContent.angle1 );
          const angle2 = dot.Utils.toRadians( dataContent.angle2 );
          const angle3 = dot.Utils.toRadians( dataContent.angle3 );
          const angle4 = dot.Utils.toRadians( dataContent.angle4 );

          const lengthA = dataContent.lengthA;
          const lengthB = dataContent.lengthB;
          const lengthC = dataContent.lengthC;
          let lengthD = dataContent.lengthD;

          // if any are null, report that there is potentially bad data being sent to the sim
          dataList = [
            angle1, angle2, angle3, angle4, lengthA, lengthB, lengthC, lengthD
          ];

          // All data is good if it is defined, non-null, not NaN, and it must be non negative
          allDataGood = _.every( dataList, data => {
            return data !== null && data !== undefined && data >= 0 && !isNaN( data );
          } );
          console.log( allDataGood );

          if ( allDataGood ) {
            if ( simulationModel.isCalibratingProperty.value ) {

              // top, right, bottom, left sides
              simulationModel.setPhysicalModelBounds( lengthA, lengthB, lengthC, lengthD );
            }

            // bottom left angle, clockwise
            // toplength, clockwise

            // angle1 -> bottom left
            // angle2 -> top left
            // angle3 -> top right
            // angle4 -> bottom right
            //
            // lengthA -> top
            // lengthB -> right
            // lengthC -> bottom
            // lengthD -> left

            // top, right, bottom, left sides then leftTop, rightTop, rightBottom, leftBottom sides
            simulationModel.quadrilateralShapeModel.setPositionsFromLengthAndAngleData( lengthA, lengthB, lengthC, lengthD, angle2, angle3, angle4, angle1 );

            // populate the readouts with values for debugging - only do this if the data is good, we don't want
            // to write "NaN" or something because we want to see the previous value
            document.getElementById( "top-side-readout" ).innerText = `Top Side: ${formatValue( lengthA )}`;
            document.getElementById( "right-side-readout" ).innerText = `Right Side: ${formatValue( lengthB )}`;
            document.getElementById( "bottom-side-readout" ).innerText = `Bottom Side: ${formatValue( lengthC )}`;
            document.getElementById( "left-side-readout" ).innerText = `Left Side: ${formatValue( lengthD )}`;

            document.getElementById( "left-top-angle-readout" ).innerText = `Left top angle: ${formatValue( angle2 )}`;
            document.getElementById( "right-top-angle-readout" ).innerText = `Right top angle:${formatValue( angle3 )}`;
            document.getElementById( "right-bottom-angle-readout" ).innerText = `Right bottom angle: ${formatValue( angle4 )}`;
            document.getElementById( "left-bottom-angle-readout" ).innerText = `Left bottom angle: ${formatValue( angle1 )}`;
          }
        }

        const dataReceived = dataList.length > 0;
        const isDataGood = ( allDataGood && dataReceived );

        dataDotElement.style.backgroundColor = dataReceived ? SUCCESS_COLOR : FAILURE_COLOR;
        badDataDotElement.style.backgroundColor = isDataGood ? SUCCESS_COLOR : FAILURE_COLOR;

        document.getElementById( "length-readout-list" ).style.color = isDataGood ? SUCCESS_TEXT_COLOR : FAILURE_COLOR;
        document.getElementById( "angle-readout-list" ).style.color = isDataGood ? SUCCESS_TEXT_COLOR : FAILURE_COLOR;

      } );

      // Other misc sim controls

      // When the debug-values-checkbox is clicked, let the simulation know that the panel should
      // be displayed
      const debugValuesCheckbox = document.getElementById( 'debug-values-checkbox' );
      debugValuesCheckbox.addEventListener( 'click', () => {
        simulationModel.showDebugValuesProperty.value = debugValuesCheckbox.checked;
      } );
    }
  } )
};

let parentWindow;
let simFrameWindow;

const simulationFrameElement = document.getElementById( "iframe" );
simulationFrameElement.addEventListener( 'load', event => {
  if ( simulationFrameElement.contentWindow.phet ) {

    // the iframe has a phet object - must be phet brand where the sim is the iframe document
    // so the the phet object is on that window and the load message goes to this window
    parentWindow = window;
    simFrameWindow = document.getElementById( "iframe" ).contentWindow;

    addReadyListenerToParentWindow( parentWindow, simFrameWindow );
  }
  else {
    parentWindow = simulationFrameElement.contentWindow;

    // For some reason the 'load' event isn't firing on the simulationElement or its window so we are going to poll
    // and wait for the element to be ready to add listeners to
    const interval = setInterval( () => {
      const simulationElement = document.getElementById( 'iframe' ).contentWindow.document.getElementById( 'sim' );
      if ( simulationElement ) {
        simFrameWindow = simulationElement.contentWindow;
        addReadyListenerToParentWindow( simulationFrameElement.contentWindow, simFrameWindow );
        clearInterval( interval );
      }
    }, 2000 );
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