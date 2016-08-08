

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


	GMOJI.Puppet.animations


	Requires

	  1  paper
	  2  TWEEN
	  3  GMOJI
	  4  GMOJI.Puppet


*****************************************************************************/




GMOJI.Puppet.prototype.eyeReset = function( side ){

	this.eyeNormalOff(   side )
	this.eyeBulgeOff(    side )
	this.eyeScrunchOff(  side, true )
	this.eyeMoonUpOff(   side, true )
	this.eyeMoonDownOff( side, true )
}




GMOJI.Puppet.prototype.eyeBulgeOn = function( side ){

	var
	eye    = this[ 'eye'+ side ],
	normal = eye.children.normal

	if( eye.isBulging !== true ){

		this.eyeReset( side )
		eye.isBulging = true
		//if( eye.bulgeAnimation !== undefined ) eye.bulgeAnimation.stop()
		//eye.bulgeAnimation =
		new TWEEN.Tween({ strokeWidth: normal.strokeWidth })
		.to({ strokeWidth: GMOJI.scale( 0.15 )}, 600 )
		.easing( TWEEN.Easing.Back.Out )
		.onUpdate( function(){

			normal.strokeWidth = this.strokeWidth
		})
		.start()
	}
}
GMOJI.Puppet.prototype.eyeBulgeOff = function( side ){

	var
	eye    = this[ 'eye'+ side ],
	normal = eye.children.normal

	if( eye.isBulging === true ){

		//eye.bulgeAnimation.stop()
		//eye.bulgeAnimation =
		new TWEEN.Tween({ strokeWidth: normal.strokeWidth })
		.to({ strokeWidth: 0 }, 600 )
		.easing( TWEEN.Easing.Back.Out )
		.onUpdate( function(){

			normal.strokeWidth = this.strokeWidth
		})
		.onComplete( function(){

			eye.isBulging = false
		})
		.start()
	}
}




GMOJI.Puppet.prototype.eyeNormalOn = function( side ){
	var
	eye    = this[ 'eye'+side ],
	normal = eye.children.normal

	if( eye.isNormal !== true ){

		eye.isNormal = true
		//if( eye.normalAnimation !== undefined ) eye.normalAnimation.stop()
		//eye.normalAnimation =
		new TWEEN.Tween({ openess: normal.scaleAbsoluteY })
		.to({ openess: 1 }, 150 )
		.easing( TWEEN.Easing.Back.Out )
		.onStart( function(){

			normal.visible = true
		})
		.onUpdate( function(){

			normal.scaleTo( 1, this.openess )
		})
		.start()
	}
	return this
}
GMOJI.Puppet.prototype.eyeNormalOff = function( side ){

	var
	eye    = this[ 'eye'+side ],
	normal = eye.children.normal

	if( eye.isNormal === true ){

		//if( eye.normalAnimation !== undefined ) eye.normalAnimation.stop()
		//eye.normalAnimation =
		new TWEEN.Tween({ openess: normal.scaleAbsoluteY })
		.to({ openess: 0.001 }, 160 )
		.easing( TWEEN.Easing.Quadratic.In )
		.onUpdate( function(){

			normal.scaleTo( 1, this.openess )
		})
		.onComplete( function(){

			normal.visible = false
			eye.isNormal   = false
		})
		.start()
	}
}




GMOJI.Puppet.prototype.eyeScrunchOn = function( side ){

	var
	eye       = this[ 'eye'+side ],
	pupil     = eye.children.normal,
	lidTop    = eye.children.eyelidTop,
	lidBottom = eye.children.eyelidBottom

	if( eye.isScrunch !== true && this.mouth.isKissing !== true ){

		this.eyeReset( side )
		eye.isScrunch = true
		//if( eye.scrunchAnimation !== undefined ) eye.scrunchAnimation.stop()
		//eye.scrunchAnimation =
		new TWEEN.Tween({ rotation: lidTop.rotationAbsolute })
		.to({ rotation: lidTop.rotationOnClosed }, 600 )
		.easing( TWEEN.Easing.Elastic.Out )
		.onStart( function(){

			lidTop.visible    = true
			lidBottom.visible = true
		})
		.onUpdate( function(){

			lidTop.rotateTo( this.rotation )
		})
		.delay( 120 )
		.start()
	}
}
GMOJI.Puppet.prototype.eyeScrunchOff = function( side, reset ){

	var
	puppet    = this,
	eye       = this[ 'eye'+side ],
	pupil     = eye.children.normal,
	lidTop    = eye.children.eyelidTop,
	lidBottom = eye.children.eyelidBottom

	if( eye.isScrunch === true ){

		//eye.scrunchAnimation.stop()
		//eye.scrunchAnimation =
		new TWEEN.Tween({ rotation: lidTop.rotationAbsolute })
		.to({ rotation: lidTop.rotationOnOpened }, 100 )
		.easing( TWEEN.Easing.Back.Out )
		.onUpdate( function(){

			lidTop.rotateTo( this.rotation )
		})
		.onComplete( function(){

			lidTop.visible    = false
			lidBottom.visible = false
			eye.isScrunch     = false
			if( reset !== true ) puppet.eyeNormalOn( side )
		})
		.start()
	}
}




    //////////////////////
   //                  //
  //   Moon Eyes UP   //
 //                  //
//////////////////////


GMOJI.Puppet.prototype.eyeMoonUpOn = function( side ){

	var
	eye    = this[ 'eye'+side ],
	normal = eye.children.normal,
	moonUp = eye.children.moonUp

	if( eye.isMoonUp !== true ){

		this.eyeReset( side )
		eye.isMoonUp = true
		//if( eye.moonUpAnimation !== undefined ) eye.moonUpAnimation.stop()
		//eye.moonUpAnimation =
		new TWEEN.Tween({ scale: moonUp.scaleAbsoluteX })
		.to({ scale: 1 }, 600 )
		.easing( TWEEN.Easing.Elastic.Out )
		.onStart( function(){

			moonUp.visible = true
		})
		.onUpdate( function(){

			moonUp.scaleTo( this.scale, moonUp.scaleAbsoluteY )
		})
		//.delay( 80 )
		.start()
	}
}
GMOJI.Puppet.prototype.eyeMoonUpOff = function( side, reset ){

	var
	puppet = this,
	eye    = this[ 'eye'+side ],
	normal = eye.children.normal,
	moonUp = eye.children.moonUp

	if( eye.isMoonUp === true ){

		//eye.moonUpAnimation.stop()
		//eye.moonUpAnimation =
		new TWEEN.Tween({ scale: moonUp.scaleAbsoluteX })
		.to({ scale: 0.5 }, 100 )
		.easing( TWEEN.Easing.Back.Out )
		.onUpdate( function(){

			moonUp.scaleTo( this.scale, moonUp.scaleAbsoluteY )
		})
		.onComplete( function(){

			moonUp.visible = false
			eye.isMoonUp   = false
			if( reset !== true ) puppet.eyeNormalOn( side )
		})
		.start()
	}
}




    ////////////////////////
   //                    //
  //   Moon Eyes DOWN   //
 //                    //
////////////////////////


GMOJI.Puppet.prototype.eyeMoonDownOn = function( side ){

	var
	eye      = this[ 'eye'+side ],
	moonDown = eye.children.moonDown

	if( eye.isMoonDown !== true ){

		this.eyeReset( side )
		eye.isMoonDown = true
		//if( eye.moonDownAnimation !== undefined ) eye.moonDownAnimation.stop()
		//eye.moonDownAnimation =
		new TWEEN.Tween({ scale: moonDown.scaleAbsoluteX })
		.to({ scale: 1 }, 600 )
		.easing( TWEEN.Easing.Elastic.Out )
		.onStart( function(){

			moonDown.visible = true
		})
		.onUpdate( function(){

			moonDown.scaleTo( this.scale, moonDown.scaleAbsoluteY )
		})
		//.delay( 80 )
		.start()
	}
}
GMOJI.Puppet.prototype.eyeMoonDownOff = function( side, reset ){

	var
	puppet   = this,
	eye      = this[ 'eye'+side ],
	normal   = eye.children.normal,
	moonDown = eye.children.moonDown

	if( eye.isMoonDown === true ){

		//if( eye.moonDownAnimation !== undefined ) eye.moonDownAnimation.stop()
		//eye.moonDownAnimation =
		new TWEEN.Tween({ scale: moonDown.scaleAbsoluteX })
		.to({ scale: 0.5 }, 100 )
		.easing( TWEEN.Easing.Back.Out )
		.onUpdate( function(){

			moonDown.scaleTo( this.scale, moonDown.scaleAbsoluteY )
		})
		.onComplete( function(){

			moonDown.visible = false
			eye.isMoonDown   = false
			if( reset !== true ) puppet.eyeNormalOn( side )
		})
		.start()
	}
}




    //////////////
   //          //
  //   Kiss   //
 //          //
//////////////


GMOJI.Puppet.prototype.doKiss = function( person ){

	var
	puppet = this,
	heart  = this.heart

	this.isKissing = true
	this.eyeMoonDownOn( 'Left' )
	this.eyeMoonDownOn( 'Right' )
	this.blushOn()
	this.mouthKissyOn(  person )


	//  Why setTimeout here instead of using Tween.delay?
	//  Because it’s going to tween from the “current” values
	//  in the m.mm Path and if we use Tween.delay then it
	//  will read those values NOW instead of at the time we
	//  want the tween to begin. Using Tween.onStart would
	//  just mean re-assigning all those values anyway.

	window.setTimeout( function(){

		puppet.mouthKissyOff( person )
		puppet.blushOff()

	}, 2000 )


	//  Animate the heart emerging from the lips
	//  and traveling up and off stage right.

	if( this.heartAnimation !== undefined ) this.heartAnimation.stop()
	this.heartAnimation = new TWEEN.Tween({

		scale: 0.004,
		x: 0.1,
		y: 0.3
	})
	.to({

		scale: 0.03,
		x:  2,
		y: -1

	}, 2000 )
	.easing( TWEEN.Easing.Quadratic.In )
	.onStart( function(){

		heart.visible = true
		heart.bringToFront()
	})
	.onUpdate( function(){

		heart.scaleTo( GMOJI.scale( this.scale ))
		heart.bounds.center = GMOJI.plot( this.x, this.y )
	})
	.onComplete( function(){

		heart.visible = false
		puppet.eyeMoonDownOff( 'Left' )
		puppet.eyeMoonDownOff( 'Right' )
	})
	.delay( 800 )
	.start()
}
GMOJI.Puppet.prototype.mouthKissyOn = function( person ){

	if( person === undefined ) person = GMOJI.person

	var
	puppet = this,
	m = this.mouth,
	centerAbs = m.mm.position.clone()

	if( this.mouth.isKissing !== true ){

		this.mouth.isKissing = true
		if( this.kissMouthAnimation !== undefined ) this.kissMouthAnimation.stop()
		this.kissMouthAnimation = new TWEEN.Tween({

			x2:          m.mm.segments[ 2 ].point.x,
			y2:          m.mm.segments[ 2 ].point.y,
			handleInX2:  m.mm.segments[ 2 ].handleIn.x,
			handleInY2:  m.mm.segments[ 2 ].handleIn.y,

			x1:          m.mm.segments[ 1 ].point.x,
			y1:          m.mm.segments[ 1 ].point.y,
			handleInX1:  m.mm.segments[ 1 ].handleIn.x,
			handleInY1:  m.mm.segments[ 1 ].handleIn.y,
			handleOutX1: m.mm.segments[ 1 ].handleOut.x,
			handleOutY1: m.mm.segments[ 1 ].handleOut.y,

			x0:          m.mm.segments[ 0 ].point.x,
			y0:          m.mm.segments[ 0 ].point.y,
			handleOutX0: m.mm.segments[ 0 ].handleOut.x,
			handleOutY0: m.mm.segments[ 0 ].handleOut.y
		})
		.to({

			x2:          person.scale * - 5 + centerAbs.x,
			y2:          person.scale * -60 + centerAbs.y,
			handleInX2:  person.scale *  40,
			handleInY2:  0,

			x1:          person.scale + centerAbs.x,
			y1:          person.scale * -30 + centerAbs.y,
			handleInX1:  person.scale *  20,
			handleInY1:  0,
			handleOutX1: person.scale *  20,
			handleOutY1: 0,

			x0:          person.scale *  -5 + centerAbs.x,
			y0:          centerAbs.y,
			handleOutX0: person.scale *  40,
			handleOutY0: 0

		}, 1000 )
		.easing( TWEEN.Easing.Back.Out )
		.onUpdate( function(){

			m.mm.segments[ 2 ].point     = [ this.x2, this.y2 ]
			m.mm.segments[ 2 ].handleIn  = [ this.handleInX2,  this.handleInY2  ]

			m.mm.segments[ 1 ].point     = [ this.x1, this.y1 ]
			m.mm.segments[ 1 ].handleIn  = [ this.handleInX1,  this.handleInY1  ]
			m.mm.segments[ 1 ].handleOut = [ this.handleOutX1, this.handleOutY1 ]

			m.mm.segments[ 0 ].point     = [ this.x0, this.y0 ]
			m.mm.segments[ 0 ].handleOut = [ this.handleOutX0, this.handleOutY0 ]
		})
		.start()
	}
}
GMOJI.Puppet.prototype.mouthKissyOff = function( person ){

	if( person === undefined ) person = GMOJI.person

	var
	puppet = this,
	m = this.mouth,
	centerAbs = m.mm.position.clone()

	if( this.mouth.isKissing === true ){

		this.kissMouthAnimation.stop()
		this.kissMouthAnimation = new TWEEN.Tween({

			x2:          m.mm.segments[ 2 ].point.x,
			y2:          m.mm.segments[ 2 ].point.y,
			handleInX2:  m.mm.segments[ 2 ].handleIn.x,
			handleInY2:  m.mm.segments[ 2 ].handleIn.y,

			x1:          m.mm.segments[ 1 ].point.x,
			y1:          m.mm.segments[ 1 ].point.y,
			handleInX1:  m.mm.segments[ 1 ].handleIn.x,
			handleInY1:  m.mm.segments[ 1 ].handleIn.y,
			handleOutX1: m.mm.segments[ 1 ].handleOut.x,
			handleOutY1: m.mm.segments[ 1 ].handleOut.y,

			x0:          m.mm.segments[ 0 ].point.x,
			y0:          m.mm.segments[ 0 ].point.y,
			handleOutX0: m.mm.segments[ 0 ].handleOut.x,
			handleOutY0: m.mm.segments[ 0 ].handleOut.y
		})
		.to({

			x2:          person.scale * -50 + centerAbs.x,
			y2:          person.scale * -10 + centerAbs.y,
			handleInX2:  0,
			handleInY2:  0,

			x1:          centerAbs.x,
			y1:          centerAbs.y,
			handleInX1:  person.scale *  20,
			handleInY1:  0,
			handleOutX1: person.scale * -20,
			handleOutY1: 0,

			x0:          person.scale *  50 + centerAbs.x,
			y0:          person.scale * -10 + centerAbs.y,
			handleOutX0: 0,
			handleOutY0: 0

		}, 1000 )
		.easing( TWEEN.Easing.Back.In )
		.onUpdate( function(){

			m.mm.segments[ 2 ].point     = [ this.x2, this.y2 ]
			m.mm.segments[ 2 ].handleIn  = [ this.handleInX2,  this.handleInY2  ]

			m.mm.segments[ 1 ].point     = [ this.x1, this.y1 ]
			m.mm.segments[ 1 ].handleIn  = [ this.handleInX1,  this.handleInY1  ]
			m.mm.segments[ 1 ].handleOut = [ this.handleOutX1, this.handleOutY1 ]

			m.mm.segments[ 0 ].point     = [ this.x0, this.y0 ]
			m.mm.segments[ 0 ].handleOut = [ this.handleOutX0, this.handleOutY0 ]
		})
		.onComplete( function(){

			puppet.mouth.isKissing = false//  For mouth animation clutch.
			puppet.isKissing     = false//  For overall kiss detection.
		})
		.start()
	}
}




    ///////////////
   //           //
  //   Sweat   //
 //           //
///////////////


GMOJI.Puppet.prototype.doSweat = function(){

	var
	puppet = this,
	sweat  = this.sweat

	if( this.isSweating !== true ){

		this.isSweating = true
		if( this.sweatAnimation !== undefined ) this.sweatAnimation.stop()
		this.sweatAnimation = new TWEEN.Tween({

			x:  0.7,
			y: -0.4,
			opacity: 0,
			rotation: 0
		})
		.to({

			x: 1.0,
			y: 1.5,
			opacity: 2,
			rotation: 60

		}, 1000 )
		.easing( TWEEN.Easing.Cubic.In )
		.onStart( function(){

			sweat.visible = true
		})
		.onUpdate( function(){

			sweat.bounds.center = GMOJI.plot( this.x, this.y )
			sweat.opacity = this.opacity
			sweat.rotateTo( this.rotation )
		})
		.onComplete( function(){

			sweat.visible     = false
			puppet.isSweating = false
		})
		.start()
	}
}




    ////////////////////
   //                //
  //   Sunglasses   //
 //                //
////////////////////


GMOJI.Puppet.prototype.sunglassesOn = function(){

	var
	puppet = this,
	target = GMOJI.plot( 0, 0.03 )

	if( this.isSunglassing !== true ){

		this.isSunglassing = true
		//if( this.sunglassesAnimation !== undefined ) this.sunglassesAnimation.stop()
		//this.sunglassesAnimation =
		new TWEEN.Tween({ y: puppet.sunglasses.position.y })
		.to({ y: target.y }, 2000 )
		.easing( TWEEN.Easing.Cubic.Out )
		.onStart( function(){

			puppet.sunglasses.visible = true
		})
		.onUpdate( function(){

			puppet.sunglasses.position.y = this.y
		})
		.start()
	}
}
GMOJI.Puppet.prototype.sunglassesOff = function(){

	var
	puppet = this,
	target = GMOJI.plot( 0, -1.5 )

	if( this.isSunglassing ){

		//this.sunglassesAnimation.stop()
		//this.sunglassesAnimation =
		new TWEEN.Tween({ y: puppet.sunglasses.position.y })
		.to({ y: target.y }, 1000 )
		.easing( TWEEN.Easing.Cubic.In )
		.onUpdate( function(){

			puppet.sunglasses.position.y = this.y
		})
		.onComplete( function(){

			puppet.sunglasses.visible = false
			puppet.isSunglassing = false
		})
		.start()
	}
}




    ///////////////
   //           //
  //   Blush   //
 //           //
///////////////


GMOJI.Puppet.prototype.blushOn = function(){

	var
	puppet = this,
	blushLeft  = this.blushLeft,
	blushRight = this.blushRight

	if( this.isBlushing !== true ){

		this.isBlushing = true
		if( this.blushAnimation !== undefined ) this.blushAnimation.stop()
		this.blushAnimation = new TWEEN.Tween({ opacity: 0 })
		.to({ opacity: 1 }, 500 )
		.easing( TWEEN.Easing.Cubic.In )
		.onStart( function(){

			blushLeft.visible  = true
			blushRight.visible = true
		})
		.onUpdate( function(){

			blushLeft.opacity  = this.opacity
			blushRight.opacity = this.opacity
		})
		.start()
	}
}
GMOJI.Puppet.prototype.blushOff = function(){

	var
	puppet = this,
	blushLeft  = this.blushLeft,
	blushRight = this.blushRight

	if( this.isBlushing === true ){

		if( this.blushAnimation !== undefined ) this.blushAnimation.stop()
		this.blushAnimation = new TWEEN.Tween({ opacity: 1 })
		.to({ opacity: 0 }, 500 )
		.easing( TWEEN.Easing.Cubic.In )
		.onUpdate( function(){

			blushLeft.opacity  = this.opacity
			blushRight.opacity = this.opacity
		})
		.onComplete( function(){

			blushLeft.visible  = false
			blushRight.visible = false
			this.isBlushing    = false
		})
		.start()
	}
}








//  Some more goodies from Jonas here.

GMOJI.Puppet.prototype.storeNormalMouth = function(){

	var person = GMOJI.person
	this.normalMouth = [];
	var y = -0.9
	var offset = [

		new paper.Point(-1,-0.0),
		new paper.Point(-0.6,0),
		new paper.Point(-0.3,0),
		new paper.Point(0,0),
		new paper.Point(0.3,0),
		new paper.Point(0.6,0),
		new paper.Point(1,0),
		new paper.Point(0.6,0),
		new paper.Point(0.3,0),
		new paper.Point(0,0),
		new paper.Point(-0.3,0),
		new paper.Point(-0.6,0),
	]

	for(var i=0;i<offset.length;i++){
		offset[i].y += y
		offset[i].x *= 0.3
	}

	for(var i=0;i<person.mouth.outer.relativeSegments.length;i++){

		var p = person.mouth.outer.relativeSegments[i].point;
		p = p.add(offset[i])
		this.normalMouth.push(p)
	}
}
