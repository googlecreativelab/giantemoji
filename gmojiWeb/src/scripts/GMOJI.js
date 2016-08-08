

//    Copyright 2016 Google Inc. All Rights Reserved.
//
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.


/*****************************************************************************


	GMOJI


	Requires

	  1  paper
	  2  TWEEN


*****************************************************************************/




//  Sure, we could have created these variables in GMOJI.setup()
//  or conversely taken all the stuff created there and instead
//  integrate it in here... But I wanted EASY access to these
//  bad boys. Top of page my good sir. Top. Of. Page.

window.GMOJI = {

	debug: false,
	easeFactor: 0.2
}


//  The debug toggle is trigged by clicking anywhere.
//  Useful to see the raw Person data!
//  So, why use .visible for the Person landmark data
//  but use .alpha for the others? Because we need the
//  bound indicators to be visible so Paper calculates
//  their true bounds and maintains its center position.

GMOJI.toggleDebug = function(){

	if( GMOJI.debug ){

		GMOJI.debug = false
		GMOJI.person.face.visible = false
		GMOJI.puppet.faceBounds.strokeColor.alpha = 0
		GMOJI.puppet.anchor.strokeColor.alpha = 0
	}
	else {

		GMOJI.debug = true
		GMOJI.person.face.visible = true
		GMOJI.puppet.faceBounds.strokeColor.alpha = 1
		GMOJI.puppet.anchor.strokeColor.alpha = 1
	}
}


//  We just use this equation so much it finally made
//  sense to formalize it here so we can call it using
//  a more compact form.

GMOJI.ease = function( numberFrom, numberTo, factor ){

	if( factor === undefined ) factor = GMOJI.easeFactor

	return (( numberTo - numberFrom ) * factor ) + numberFrom
}
GMOJI.easePoint = function( pointFrom, pointTo, factor ){

	if( factor === undefined ) factor = GMOJI.easeFactor

	return pointTo.subtract( pointFrom ).multiply( factor ).add( pointFrom )
}




//  Setup kicks off after the DOM content is loaded.

GMOJI.setup = function(){


	//  Setup Paper.js.

	paper.setup( document.getElementById( 'gmoji' ))


	//  Setup our scale such that (-1,-1) to (+1,+1) represents
	//  the largest square that can fit on the screen, like so:
	//                    Top
	//         (-1,-1)  (+1,-1)  (+1,-1)
	//   Left  (-1, 0)  ( 0, 0)  (+1, 0)  Right
	//         (-1,+1)  ( 0,+1)  (+1,+1)
	//                   Bottom

	paper.view.onResize = function(){

		GMOJI.scaleRoot = Math.min( paper.view.bounds.width, paper.view.bounds.height ) / 2
	}
	paper.view.onResize()
	GMOJI.scale = function( w, h ){

		if( typeof w === 'number' && typeof h === 'number' ){

			return [

				w * GMOJI.scaleRoot,
				h * GMOJI.scaleRoot
			]
		}
		else return w * GMOJI.scaleRoot
	}
	GMOJI.plot = function( x, y ){

		if( typeof x === 'number' ){

			if( typeof y === 'number' ){

				return {

					x: paper.view.center.x + ( x * GMOJI.scaleRoot ),
					y: paper.view.center.y + ( y * GMOJI.scaleRoot )
				}
			}
			else return paper.view.center.x + ( x * GMOJI.scaleRoot )
		}
		else if( x.x !== undefined && x.y !== undefined ){

			return {

				x: paper.view.center.x + ( x.x * GMOJI.scaleRoot ),
				y: paper.view.center.y + ( x.y * GMOJI.scaleRoot )
			}
		}
	}


	//  How do we know when we should slip into idle / attractor mode?
	//  With every draw loop we’ll increment a counter
	//  and each time we receive new landmark data we’ll reset it.

	GMOJI.landmarksLastSeenAt = 0//Date.now()
	GMOJI.isIdle              = true
	GMOJI.idleLastFaceChange  = undefined
	GMOJI.idleFaceIndex       = 0
	GMOJI.isDisconnected      = true


	//  Prepare the library of previously exported GMOJI faces.
	//  This is useful for a default face and for an idling
	//  screensaver of faces.

	GMOJI.Person.facesList.forEach( function( key ){

		GMOJI.Person.FACES[ key ] = new GMOJI.Person( GMOJI.Person.FACES[ key ])
		GMOJI.Person.FACES[ key ].name = key
	})


	//  Create a “person” which is our representation of YOU,
	//  the active participant! Lovely, eh?

	GMOJI.person = new GMOJI.Person()
	GMOJI.idleFace = GMOJI.Person.FACES.WINK
	GMOJI.disconnectedFace = GMOJI.Person.FACES.SMILE_SMALL


	//  YOU will be driving our puppet’s movement and expressions.
	//  Let’s create that puppet now.

	GMOJI.puppet = new GMOJI.Puppet( GMOJI.person )


	//  Anything else interactive we ought to tend to?

	document.addEventListener( 'click', GMOJI.toggleDebug )
	document.addEventListener( 'click', GMOJI.puppet.storeNormalMouth )


	//  Make it so. (At 60 frames per second.)

	paper.view.onFrame = GMOJI.update


	//  Oh, before we’re done we should probably setup our communications!
	//  This is how the Android tablet and output screen talk to each other.

	if( window.io ){

	    window.socket = io()
	    socket.on( 'evalClient', function( msg ){

	        eval( msg )
	    })
	    socket.io.on( 'connect_error', function( err ){

		    GMOJI.isDisconnected = true
		})
	}
	setInterval( function(){

	    var stats = [], i

	    for( i = 0; i < 9; i ++ ){

	        stats.push( Math.random() )
	    }
	    sendStats( stats )

	}, 1000 )
}


//  Now we’re cooking. Here are all the loopy things.
//  Because we set paper’s onFrame() = GMOJI.update()
//  this will be called via requestAnimationFrame().

GMOJI.update = function(){

	if( TWEEN ) TWEEN.update()


	//  If we’re idle or disconnected then let’s do a little
	//  random face routine...

	if( GMOJI.isIdle === true || GMOJI.isDisconnected === true ){
		
		
		//  Let’s show a random face every X seconds.
		
		if( !GMOJI.idleLastFaceChange || Date.now() - GMOJI.idleLastFaceChange > 1000 * 10 ){
			
			GMOJI.idleLastFaceChange = Date.now()
			if( Math.random() > 0.1 ){
				
				GMOJI.idleFace = GMOJI.Person.FACES.SMILE_SMALL_BLINK
			} 
			else {
			
				GMOJI.idleFace = GMOJI.Person.FACES.SMILE_SMALL_WINK
			}
			setTimeout( function(){
				
				GMOJI.idleFace = GMOJI.Person.FACES.SMILE_SMALL
			
			}, Math.random() * 400 + 400 )
		}
		GMOJI.puppet.update( GMOJI.idleFace )
	}


	//  And if none of the above is true then it’s
	//  business as usual:

	else {
		
		GMOJI.idleLastFaceChange = undefined
		GMOJI.puppet.update( GMOJI.person )
		if( Date.now() - GMOJI.landmarksLastSeenAt > 1000 * 2 ) GMOJI.idleStateBegin()
	}
}
GMOJI.idleStateBegin = function(){

	GMOJI.isIdle = true
	GMOJI.idleLastFaceChange = Date.now()
	GMOJI.idleFaceIndex = 0
}
GMOJI.idleStateEnd = function(){

	GMOJI.landmarksLastSeenAt = Date.now()
	GMOJI.isIdle = false
}
GMOJI.shuffle = function( list, makeLoopable ){

	var
	listCopy = list.slice(),
	nextList = [],
	indexA, indexB,
	tempItemA, tempItemB

	if( makeLoopable ){

		indexA = Math.floor( Math.random() * ( listCopy.length - 1 ))
		nextList.push( listCopy.splice( indexA, 1 )[ 0 ])
	}
	indexA = listCopy.length
	while( -- indexA ){

		indexB = Math.floor( Math.random() * ( indexA + 1 ))
		tempItemA = listCopy[ indexA ]
		tempItemB = listCopy[ indexB ]
		listCopy[ indexA ] = tempItemB
		listCopy[ indexB ] = tempItemA
	}
	return nextList.concat( listCopy )
}




    ///////////////
   //           //
  //   Paper   //
 //           //
///////////////


paper.Item.inject({


	//  Paper’s Item.rotate() function takes relative arguments
	//  rather than absolute ones. This quick fix allows for
	//  absolute values but does not change how Item.rotate()
	//  itself works -- because reasons. So don’t use it.
	//  Instead use .rotateBy() for relative and .rotateTo()
	//  for absolute values.

	rotationAbsolute: 0,
	rotateBy: function( angle, origin ){

		this.rotationAbsolute += angle
		if( origin === undefined ) this.rotate( angle )
		else this.rotate( angle, origin )
	},
	rotateTo: function( angle, origin ){

		this.rotateBy( angle - this.rotationAbsolute, origin )
	},


	//  Paper’s Item.scale() has the same issue and so I’ve got
	//  a very similar patch. The minor difference is .scale()
	//  can accept up to 2 arguments. Note that scaling is relative
	//  to Paper’s axes and NOT to the item’s original rotation.

	scaleAbsoluteX: 1,
	scaleAbsoluteY: 1,
	scaleBy: function( magnitudeX, magnitudeY ){

		if( magnitudeY === undefined ) magnitudeY = magnitudeX
		this.scaleAbsoluteX *= magnitudeX
		this.scaleAbsoluteY *= magnitudeY
		this.scale( magnitudeX, magnitudeY )
	},
	scaleTo: function( magnitudeX, magnitudeY ){

		if( magnitudeY === undefined ) magnitudeY = magnitudeX
		this.scaleBy(

			magnitudeX / this.scaleAbsoluteX,
			magnitudeY / this.scaleAbsoluteY
		)
	}
})




    ///////////////
   //           //
  //   Comms   //
 //           //
///////////////


function ofAppInfo( info ){

	document.getElementById( 'info' ).innerText = 'INFO: '+ JSON.stringify( info )
}
function ofTracker( data ){

	if( data.landmarks ) GMOJI.isDisconnected = false
	if( data.landmarks.length ){

		//console.log( data )
		GMOJI.idleStateEnd()
		GMOJI.person.update( data )
	}
}
function sendStats( stats ){

	socket.emit( 'statsClient', { stats: stats })
}




//  Kick it off, Mate!

document.addEventListener( 'DOMContentLoaded', GMOJI.setup )
