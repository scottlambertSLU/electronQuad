// console.log( global.setImmediate );
// const io = require( 'socket.io-client' );
// const socket = io( "http://localhost:3000" );
//
// window.addEventListener( 'message', event => {
//   if ( !event.data ) {
//     return;
//   }
//
//   let data;
//   try {
//     data = JSON.parse( event.data );
//   }
//   catch( e ) {
//     return;
//   }
//
//   console.log( 'trying to send message' );
//   // socket.emit( "message", "hello from preload.js" );
// } );
//
// window.setInterval( () => {
//   console.log( 'trying to send message' );
//   socket.emit( "message", "hello from preload.js" );
// }, 1000 );


// window.addEventListener( 'DOMContentLoaded', () => {
//   window.addEventListener( 'message', event => {
//     if ( !event.data ) {
//       return;
//     }
//
//     let data;
//     try {
//       data = JSON.parse( event.data );
//     }
//     catch( e ) {
//       return;
//     }
//
//     if ( data.type === 'load' ) {
//       const simFrameWindow = document.getElementById( "iframe" ).contentWindow;
//
//       const simModel = simFrameWindow.simModel;
//       console.log( simFrameWindow.phet );
//       window.simulationWindow = simFrameWindow;
//       /*
//       const vertex1 = simFrameWindow.vertex1;
//       const vertex2 = simFrameWindow.vertex2;
//       const vertex3 = simFrameWindow.vertex3;
//       const vertex4 = simFrameWindow.vertex4;
//       */
//       //var positionProperty = simFrameWindow.positionProperty
//       //debugger
//       var dot = simFrameWindow.phet.dot
//       const physicalToSimLengthMap = new dot.LinearFunction( 5.5, 9.2, 0.05, 1.0 );
//
//       // // we are ready to start calibrating, start populating values
//       // socket.on( 'data', function( data ) {
//       //   pdata = JSON.parse( data );
//       //   var angle1 = pdata.angle1;
//       //   var angle2 = pdata.angle2;
//       //   var angle3 = pdata.angle3;
//       //   var angle4 = pdata.angle4;
//       //
//       //   var lengthA = pdata.lengthA;
//       //   var lengthB = pdata.lengthB;
//       //   var lengthC = pdata.lengthC;
//       //   var lengthD = pdata.lengthD;
//       //
//       //   if ( simModel.isCalibratingProperty.value ) {
//       //     simModel.setPhysicalModelBounds( lengthC, lengthB, lengthA, lengthD );
//       //   }
//       //   console.log( angle1 );
//       //   console.log( angle2 );
//       //   console.log( angle3 );
//       //   console.log( angle4 );
//       //   console.log( "" );
//       //   console.log( "lengthA:", lengthA );
//       //   console.log( "lengthB:", lengthB );
//       //   console.log( "lengthC:", lengthC );
//       //   console.log( "lengthD:", lengthD );
//       //   console.log( "" );
//       //   simModel.setPositionsFromLengthAndAngleData( lengthC, lengthB, lengthA, lengthD, angle1, angle4, angle2, angle3 );
//       //
//       //   /*
//       //   const newPositionX = physicalToSimLengthMap(lengthA);
//       //   const constrainedPosition = vertex3.positionProperty.validBounds.closestPointTo(new dot.Vector2(newPositionX,vertex3.positionProperty.value.y));
//       //   vertex3.positionProperty.value = constrainedPosition;
//       //   console.log(constrainedPosition);
//       //   //debugger
//       //   document.getElementById('sample').style.opacity = data+"%";
//       //   //positionProperty.set(positionProperty.get().plusXY(5,0))
//       //   */
//       // } );
//
//       // socket.emit( "message", "hello from preload.js" );
//     }
//
//   } );
// } );