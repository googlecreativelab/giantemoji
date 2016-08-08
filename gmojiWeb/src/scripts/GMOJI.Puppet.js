

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


	GMOJI.Puppet


	Requires

	  1  paper
	  2  TWEEN
	  3  GMOJI


*****************************************************************************/




GMOJI.Puppet = function( person ){

	var
	puppet = this,
	w, h,
	x0, x1


	//  Define an anchor point that all puppet features
	//  will be drawn relative to.

	this.position = paper.view.center.clone()
	this.angle    = 0
	this.scale    = 1


	//  This is a quick hack to make life easier.
	//  Paper.js has a quirk where you cannot change the position
	//  of an item and also rotate it around an arbitrary point.
	// (It will instead rotate around its bounds’ center.)
	//  So just pack everything into a Group and rotate that, right?
	//  Well, not exactly...
	//  Because the sizes of things in the Group are changing,
	//  and because rotation happens around the bounds’ center
	//  that means the point of rotation is changing too!!!
	//  So instead we make a group with an incredibly large child
	//  circle inside it so that our bounds never change.
	//  This also means this.faceBounds.visible MUST = true.
	//  so turning it “on and off” means adjusting the alpha instead.
	// (When we refactor we can just use straight Matrices.)

	this.face = new paper.Group({

		name:  'face',
		position: paper.view.center,
		transformContent: false//  Keep child objects with relative coordinates.
	})
	this.faceBounds = new paper.Path.Circle({

		name:  'faceBounds',
		center: paper.view.center,
		radius: paper.view.bounds.width * 2,
		strokeColor: '#3366CC'
	})
	this.faceBounds.strokeColor.alpha = 0
	this.face.addChild( this.faceBounds )
	this.anchor = new paper.Path.Circle({

		name:  'anchor',
		center: paper.view.center,
    	radius: 10,
    	strokeColor: '#FF0000'
	})
	this.anchor.strokeColor.alpha = 0
	this.face.addChild( this.anchor )


	//  This is a strange game of proportions.
	//  Sort of mostly not quite matching the
	//  proportion in the vector files.

	w = GMOJI.scale( 0.2 )//  Half width of a normal eye.
	h = w * 1.1940206693  //  Half height of a normal eye.




	    /////////////////////
	   //                 //
	  //   Random Bits   //
	 //                 //
	/////////////////////


	this.face.addChild( this.blushLeft = new paper.Path.Circle({

		name: 'blushLeft',
		closed: true,
		center: GMOJI.plot( -0.3, 0.3 ),
		radius: person.scale * 80,
		fillColor: {
		
			gradient: {

				stops: [[ '#F79329', 0.1 ], [ 'rgba(255,180,0,0)', 1.0 ]],
				radial: true
			},
			origin: GMOJI.plot( -0.3, 0.3 ),
			destination: GMOJI.plot( 0, 0.3 )
		},
		opacity: 0
	}))
	this.blushRight = this.blushLeft.clone()
	this.blushRight.name = 'blushRight'
	this.blushRight.position = GMOJI.plot( 0.3, 0.3 )




	    ///////////////
	   //           //
	  //   Mouth   //
	 //           //
	///////////////


	this.mouth = {

		isClosed:       false,
		isSmilingSmall: false,
		isSmilingBig:   false,
		isFrowning:     false,
		isSayingOh:     false,
		defaultType:   'svg',//  stew || jonas || svg
		isKissing:      false,
		kissPoseTime:   0
	}


	//  Say “Mm!”

	this.face.addChild( this.mouth.mm = new paper.Path({

		name: 'mm',
		closed: false,
		segments: [

			[ person.scale * -20, 0 ],
			new paper.Segment({

				point:     [ 0, 0 ],
				handleIn:  [ person.scale * -10, 0 ],
				handleOut: [ person.scale *  10, 0 ]
			}),
			[ person.scale * 20, 0 ]
		],
		strokeColor: '#2F2F2F',
		strokeWidth: w / 4,
		strokeCap: 'round',
		position: GMOJI.plot( 0, 0.5 ),
		pivot: GMOJI.plot( 0, 0.5 ),
		applyMatrix: false,
		miterLimit: 2
	}))


	//  Say “Oh!”  :O

	this.face.addChild( this.mouth.oh = new paper.Path({

		name: 'oh',
		closed: true,
		position: GMOJI.plot( 0, 0.45 ),
		fillColor: '#ED6C30',
		segments: [[[40.9948,30.7319],[0,-13.9704],[0,13.97]],[[20.4974,50.5919],[11.3204,0],[-11.3204,0]],[[0,30.7319],[0,13.9704],[0,-13.9704]],[[20.4974,0],[-11.32,0],[11.32,0]]]
	}))


	//  Frowny face  :(

	this.face.addChild( this.mouth.frown = new paper.Path({

		name: 'frown',
		closed: true,
		position: GMOJI.plot( 0, 0.45 ),
		fillColor: '#ED6C30',
		segments: [[[1.1513,19.322],[-2.5244,-1.7054],[1.9906,1.3448]],[[7.865,19.322],[-2.2143,0.4573],[4.6772,-0.92665]],[[22.0699,17.9925],[-4.76793,-0.04264],[4.76796,-0.04265]],[[36.2749,19.322],[-4.67724,-0.92666],[2.2142,0.4573]],[[42.9885,19.322],[-1.9906,1.3448],[2.5243,-1.7054]],[[39.6765,7.3537],[3.9761,4.1401],[-4.59887,-4.78134]],[[22.0699,0],[6.63345,-0.08997],[-6.63345,-0.08997]],[[4.4633,7.3537],[4.59887,-4.78134],[-3.9761,4.1401]]]
	}))


	//  Smile big  :D

	this.mouth.smile = { visible: false }
	paper.project.importSVG( 'media/mouth-smile.svg', function( event ){

		event.name         = 'smile'
		event.position     =  GMOJI.plot( 0, 0.4 )
		event.visible      =  false
		puppet.mouth.smile =  event
		puppet.face.addChild( event )
	})


	//  Say “Ah!”

	/*if( this.mouth.defaultType === 'jonas' ){

		this.face.addChild( this.mouth.ah = new paper.Path({

			name: 'ah',
			fillColor:'#ED6C30',
			scaling: GMOJI.scale( 0.8 ),
			position: GMOJI.plot(  0.0, -0.3 ),
			visible: false,
			closed: true,
			transformContent: false
		}))
	}
	else if( this.mouth.defaultType === 'stew'){

		this.face.addChild( this.mouth.ah = new paper.Path({

			name: 'ah',
			fillColor: '#ED6C30',
			closed: true,
			//visible: false,
			//selected: true,
			segments: [[[96.46,70.26],[3.91,2.65],[-3.09,-2.09]],[[86.04,70.26],[3.44,-0.71],[-9.58,1.98]],[[64,72.32],[4.04,0],[-4.04,0]],[[41.96,70.26],[9.58,1.98],[-3.44,-0.71]],[[31.54,70.26],[3.09,-2.09],[-3.92,2.65]],[[36.68,88.83],[-6.17,-6.42],[3.73,3.88]],[[64,100.24],[-14.71,0],[14.71,0]],[[91.32,88.83],[-3.73,3.88],[6.17,-6.42]]],
			position: GMOJI.plot( 0, 0.5 ),
			applyMatrix: false
		}))
		this.mouth.ah.emojiSegments = []
		this.mouth.ah.segments.forEach( function( segment ){

			puppet.mouth.ah.emojiSegments.push( segment.clone() )
		})
		this.mouth.ah.scale( 2 )
	} else*/ if(this.mouth.defaultType === 'svg'){
		this.mouth.ah = { visible: false }
		paper.project.importSVG( 'media/mouth-open.svg', function( event ){

			event.name         = 'ah'
			event.position     =  GMOJI.plot( 0, 0.4 )
			event.visible      =  false
			puppet.mouth.ah =  event
			puppet.face.addChild( event )
		})

	}




	    //////////////
	   //          //
	  //   Eyes   //
	 //          //
	//////////////


	this.eyeLeft = new paper.Group({

		name:       'eyeLeft',
		applyMatrix: false,
		position:    GMOJI.plot( -0.3, 0 ),
		children: [

			new paper.Path.Circle({

				name:      'eyeBounds',
				center:     [ 0, 0 ],
				radius:     w * 3,
				fillColor: '#00FF00'
			}),
			new paper.Path.Ellipse({

				name:        'normal',
				center:       [ 0, 0 ],
				size:         [ w, h ],
				fillColor:   '#2F2F2F',
				strokeColor: '#2F2F2F',
				//strokeColor: '#FFFFFF',
				strokeWidth: 0
			}),
			new paper.Path.Line({

				name: 'eyelidBottom',
				from: [ w * -0.6, w / 4 ],//  Ear side.
				to:   [ w *  0.7, w / 9 ],//  Nose side.
				strokeColor: '#2F2F2F',
				strokeWidth: w / 4,
				strokeCap: 'round',
				visible: false
			}),
			new paper.Path.Line({

				name: 'eyelidTop',
				from:  [ w * -0.6, w / -3 ],//  Ear side.
				to:    [ w *  0.7, w /  9 ],//  Nose side.
				pivot: [ w *  0.7, w /  9 ],
				strokeColor: '#2F2F2F',
				strokeWidth: w / 4,
				strokeCap: 'round',
				visible: false
			}),
			new paper.Path.Line({

				name: 'moonUp',
				fillColor: '#2F2F2F',
				visible: false,
				closed: true,
				segments: [[[5.0601,10.4062],[2.19677,-3.16951],[-0.77288,1.28327]],[[1.33525,11.34301],[1.28801,0.76495],[-1.28801,-0.76495]],[[0.3755,7.624],[-0.757,1.2927],[3.18021,-4.82355]],[[14.7496,0],[-5.77712,-0.0726],[5.77991,-0.07062]],[[29.1358,7.624],[-3.18677,-4.82254],[0.75865,1.29553]],[[28.17242,11.35001],[1.29153,-0.76544],[-1.29153,0.76544]],[[24.4414,10.4062],[0.77221,1.28749],[-2.19463,-3.17316]],[[14.7496,5.4511],[3.85734,-0.07898],[-3.85565,-0.07437]]],
				position: [ 0, 0 ],
				scaling: GMOJI.scale( 0.01 ),
				applyMatrix: false
			}),
			new paper.Path.Line({

				name: 'moonDown',
				fillColor: '#2F2F2F',
				visible: false,
				closed: true,
				segments: [[[5.0601,1.3242],[2.19679,3.16947],[-0.77288,-1.28327]],[[1.33525,0.38739],[1.28801,-0.76495],[-1.28801,0.76495]],[[0.3755,4.1064],[-0.757,-1.2927],[3.18021,4.82355]],[[14.7496,11.7304],[-5.77712,0.0726],[5.77991,0.07062]],[[29.1358,4.1064],[-3.18677,4.82254],[0.75865,-1.29553]],[[28.17242,0.38039],[1.29153,0.76544],[-1.29153,-0.76544]],[[24.4414,1.3242],[0.77221,-1.28749],[-2.19465,3.17312]],[[14.7496,6.2792],[3.85732,0.079],[-3.85563,0.07439]]],
				position: [ 0, 0 ],
				scaling: GMOJI.scale( 0.01 ),
				applyMatrix: false
			}),
			new paper.Group({

				name:       'surprised',
				visible:     false,
				applyMatrix: false,
				children: [

					new paper.Path.Ellipse({

						name:      'sclera',
						center:     [ 0, 0 ],
						size:       [ h * 1.6, w * 2 ],
						fillColor: '#FFFFFF',
					}),
					new paper.Path.Ellipse({

						name:      'pupil',
						center:     [ 0, 0 ],
						size:       [ h * 0.6, h * 0.6 ],
						fillColor: '#2F2F2F',
					})
				]
			})
		]
	})
	this.eyeLeft.children.eyeBounds.fillColor.alpha = 0
	this.face.addChild( this.eyeLeft )


	//  We just finished building the left eye.
	//  Now all we have to do for righty is clone
	//  lefty and customize a few properties!

	this.eyeRight          =  this.eyeLeft.clone()
	this.eyeRight.name     = 'eyeRight'
	this.eyeRight.position =  GMOJI.plot( 0.3, 0 )


	//  Mirror the X values (ie. flip the damn thing).

	x0 = this.eyeRight.children.eyelidBottom.segments[ 0 ].point.x
	x1 = this.eyeRight.children.eyelidBottom.segments[ 1 ].point.x
	this.eyeRight.children.eyelidBottom.segments[ 0 ].point.x = x1
	this.eyeRight.children.eyelidBottom.segments[ 1 ].point.x = x0


	//  Do it again for the eyelid top.
	//  And also be sure to modify the pivot point.

	x0 = this.eyeRight.children.eyelidTop.segments[ 0 ].point.x
	x1 = this.eyeRight.children.eyelidTop.segments[ 1 ].point.x
	this.eyeRight.children.eyelidTop.segments[ 0 ].point.x = x1
	this.eyeRight.children.eyelidTop.segments[ 1 ].point.x = x0
	this.eyeRight.children.eyelidTop.pivot = this.eyeRight.children.eyelidTop.segments[ 1 ].point


	//  Because these are not Paper properties
	//  they couldn’t be cloned above so we
	//  have to set them explicitly on both eyes.

	this.eyeLeft.isNormal = true
	this.eyeLeft.children.eyelidTop.rotationOnClosed =   3
	this.eyeLeft.children.eyelidTop.rotationOnOpened = -20
	this.eyeRight.isNormal = true
	this.eyeRight.children.eyelidTop.rotationOnClosed = -3
	this.eyeRight.children.eyelidTop.rotationOnOpened = 20




	    ////////////////
	   //            //
	  //   Extras   //
	 //            //
	////////////////


	this.heart = { visible: false }
	paper.project.importSVG( 'media/heart.svg', function( event ){

		event.name = 'heart'
		event.scaleTo( GMOJI.scale( 0.001 ))
		event.position = GMOJI.plot( 0.4, 0.4 )
		event.visible  = false
		puppet.heart   = event
		puppet.face.addChild( event )
	})
	this.sweat = { visible: false }
	paper.project.importSVG( 'media/sweat.svg', function( event ){

		event.name = 'sweat'
		event.scaleTo( GMOJI.scale( 0.01 ))
		event.position = GMOJI.plot( 0.4, 0.4 )
		event.visible  = false
		puppet.sweat   = event
		puppet.face.addChild( event )
	})
	this.sunglasses = { visible: false }
	paper.project.importSVG( 'media/sunglasses.svg', function( event ){

		event.name        = 'sunglasses'
		event.scaleTo( GMOJI.scale( 0.01 ))
		event.position    = GMOJI.plot( 0, -1.5 )
		event.visible     = false
		puppet.sunglasses = event		
		puppet.face.addChild( event )
	})




	//  If there’s some Person data available we should
	//  use it to update straight out of the box!

	if( person === undefined ) person = GMOJI.person
	if( person !== undefined ) this.update( person )
}
