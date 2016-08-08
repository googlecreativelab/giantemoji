

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


	GMOJI.Puppet.update


	Requires

	  1  paper
	  2  TWEEN
	  3  GMOJI
	  4  GMOJI.Puppet
	  5  GMOJI.Puppet.animations


*****************************************************************************/




GMOJI.Puppet.prototype.update = function( person ){

	var
	puppet = this,
	m = this.mouth,//  Convenience, eh?
	mouthAspect,
	mouthMinWidth,
	mouthMinHeight,
	targetP, x, y, delta,
	el




	//  Ok. Let’s get down to it. Safety first.

	if( person === undefined ) person = GMOJI.person


	//  FACE POSITION + ROTATION.
	//  Where should our puppet’s anchor point be?
	//  How much should our features be rotated?
	//  Remember: This anchor point is right between
	//  the eyes and all features are relative to it.

	this.scale = GMOJI.ease( this.scale, person.scale )
	this.scale = Math.max( 1.3, this.scale )
	this.scale = Math.min( 1.5, this.scale )
	this.angle = GMOJI.ease( this.angle, person.angle )

	if( GMOJI.isIdle ){
		
		x = Math.sin(new Date().getTime() / 1300.)* Math.sin(new Date().getTime() / 500.)*10*Math.sin(new Date().getTime() / 200.)*Math.sin(new Date().getTime() / 490.)
		y = Math.sin(new Date().getTime() / 1200.)*Math.sin(new Date().getTime() / 300.)*10*Math.sin(new Date().getTime() / 210.)*Math.sin(new Date().getTime() / 494.)
		this.position = GMOJI.easePoint( this.position, paper.view.center.add(new paper.Point(x,y)),0.1 )
		this.offset   = GMOJI.easePoint( this.offset, new paper.Point(0,100) )
	} 
	else {
	
		this.position = GMOJI.easePoint( this.position, person.center )
		this.offset   = GMOJI.easePoint( this.offset, this.position.subtract(paper.view.center).subtract( new paper.Point( 0, -200 )), 0.01 )
	}
	this.face.scaleTo( 1 )
	this.face.rotateTo( 0 )
	this.face.position = this.position.subtract( this.offset )




	    ///////////////
	   //           //
	  //   Mouth   //
	 //           //
	///////////////


	//  We’re receiving values -- sometimes distances in space,
	//  but often normalized probabilities (0..1) -- and we want
	//  to decide what the hardlines are for true / false.
	//  We’re going to use a “bang-bang” approach which uses
	//  separate thresholds for On and Off.
	//  https://en.wikipedia.org/wiki/Bang%E2%80%93bang_control

	mouthMinWidth  = person.scale * 45
	mouthMinHeight = person.scale * 10
	mouthAspect    = person.mouth.outer.trueWidth / person.mouth.outer.trueHeight


	if( !m.mouthTransitionTimer || Date.now() - m.mouthTransitionTimer > 300 ){
		

		//  NOTE: 
		//  Here you can see some near redundancy in state booleans
		//  and in the handling of the bits. Result of down-to-the-wire
		//  tag teaming to get this biz in order!

		var 
		_isClosed       = m.isClosed,
		_isKissing      = m.isKissing,
		_isSmilingSmall = m.isSmilingSmall,
		_isSmilingBig   = m.isSmilingBig,
		_isSayingOh     = m.isSayingOh


		//  Mouth is closed?

		if(      person.mouth.inner.trueHeight > person.scale * 12 ) m.isClosed = false
		else if( person.mouth.inner.trueHeight < person.scale *  8 ) m.isClosed = true


		//  Mouth is kissing?

		if( m.isClosed === true && mouthAspect > 1.6 && mouthAspect < 2.2 && this.isKissing !== true ){

			if( m.isKissingTimer === undefined ){

				m.isKissingTimer = Date.now()
			}
			else if( Date.now() - m.isKissingTimer > 1000 ){

				this.doKiss( person )
			}
		}
		else m.isKissingTimer = undefined


		//  Mouth is smiling small?

		if(      person.mouth.isSmilingSmall > 0.6 ) m.isSmilingSmall = true
		else if( person.mouth.isSmilingSmall < 0.4 ) m.isSmilingSmall = false


		//  Mouth is smiling big?

		if( person.mouth.isSmilingBig > 0.4 ){

			if( m.isSmilingBig === false ) m.isSmilingBigTimer = Date.now()
			else if( GMOJI.isIdle === false && Date.now() - m.isSmilingBigTimer > 1000 * 6 ){

				puppet.doSweat()//  This will repeat itself just by its nature.
			}
			else if( GMOJI.isIdle === false && Date.now() - m.isSmilingBigTimer > 1000 * 4 ){

				puppet.sunglassesOn()
			}
			else if( Date.now() - m.isSmilingBigTimer > 1000 * 2 ){

				puppet.eyeMoonUpOn( 'Left' )
				puppet.eyeMoonUpOn( 'Right' )
			}
			m.isSmilingBig = true
		}
		else if( person.mouth.isSmilingBig < 0.3 ){

			if( m.isSmilingBig === true ){

				puppet.eyeMoonUpOff( 'Left' )
				puppet.eyeMoonUpOff( 'Right' )
				puppet.sunglassesOff()
			}
			m.isSmilingBig = false
		}


		//  Mouth is frowning?

		if(      person.mouth.isFrowning > 0.7 ) m.isFrowning = true
		else if( person.mouth.isFrowning < 0.6 ) m.isFrowning = false


		//  Mouth is open in O shape?

		if(      person.mouth.isSayingOh > 0.5 ) m.isSayingOh = true
		else if( person.mouth.isSayingOh < 0.4 ) m.isSayingOh = false


		//  Check for state change.

		if(_isClosed        != m.isClosed       ||
			_isKissing      != m.isKissing      ||
			_isSmilingSmall != m.isSmilingSmall ||
			_isSmilingBig   != m.isSmilingBig   ||
			_isSayingOh     != m.isSayingOh     ){
				
			m.mouthTransitionTimer = Date.now()
		}
	}




	//  NOTE: 
	//  This is where Jonas really came in and fixed some last-minute
	//  bits on-site. Sweet, no?
	//  You can mos def see the difference in our code styles ;)

	// Update smile size and position (global for all types of open mouth)
	var _smileWidth = 80*2.6;
	var _smileHeight = 80;
	var _smileOffset = 0;

	var _mouthColor = [47,47,47]

	if(m.isSmilingBig){
	 	_smileHeight = person.mouth.inner.trueHeight * 3.6;
		_smileWidth = person.mouth.inner.trueWidth  * 2.4;

		// Limit its size
		if(_smileHeight > 200) _smileHeight = 200;
		if(_smileHeight < 120) _smileHeight = 120;

		if(_smileWidth > _smileHeight*3) _smileWidth = _smileHeight*3;
		if(_smileWidth < _smileHeight*1.5) _smileWidth = _smileHeight*1.5;

	}
	else if(m.isSayingOh){
		_mouthColor = [237,108,48];
	 	_smileHeight = person.mouth.inner.trueHeight * 3.6;
		_smileWidth = person.mouth.inner.trueWidth  * 1.5;

		// Limit its size
		if(_smileHeight > 200) _smileHeight = 200;
		if(_smileHeight < 50) _smileHeight = 50;

		//if(_smileWidth > _smileHeight*3) _smileWidth = _smileHeight*3;
		//if(_smileWidth < _smileHeight*1.5) _smileWidth = _smileHeight*1.5;

	} else if( !m.isClosed && !m.isKissing ){
		_mouthColor = [237,108,48];
		// Normal orange mouth (slighty narrower)
	 	_smileHeight = person.mouth.inner.trueHeight * 3.6;
		_smileWidth = person.mouth.inner.trueWidth  * 1.8;

		// Limit its size
		if(_smileHeight > 200) _smileHeight = 200;
		if(_smileHeight < 50) _smileHeight = 50;

		if(_smileWidth > _smileHeight*3) _smileWidth = _smileHeight*3;
		if(_smileWidth < _smileHeight*1.5) _smileWidth = _smileHeight*1.5;
	} else {
		// Closed mouth
		_smileHeight = 1;
	}
	_smileOffset = (m.smileHeight*0.0008)+0.4;

	m.smileHeight = GMOJI.ease(m.smileHeight||0, _smileHeight);
	m.smileWidth = GMOJI.ease(m.smileWidth||0, _smileWidth);
	m.smileY = GMOJI.ease(m.smileY||0, _smileOffset);

	if(!m.mouthColor) m.mouthColor = [0,0,0]
	m.mouthColor[0] = GMOJI.ease(m.mouthColor[0], _mouthColor[0],0.1);
	m.mouthColor[1] = GMOJI.ease(m.mouthColor[1], _mouthColor[1],0.1);
	m.mouthColor[2] = GMOJI.ease(m.mouthColor[2], _mouthColor[2],0.1);

	m.ah.fillColor = m.ah.strokeColor = new paper.Color(m.mouthColor[0]/256, m.mouthColor[1]/256, m.mouthColor[2]/256)








	//  Say “Mm!”
	//  Our person’s mouth is closed so we’re just limited to
	//  an outline separating the lips. The center of this is
	//  stationary -- only the corners move up and down to reflect
	//  the mouth of the person.

	if( m.isClosed || m.isKissing ){

		m.ah.visible    = false
		m.oh.visible    = false
		m.smile.visible = false

		if( m.isKissing ){

			m.frown.visible = false
			m.mm.visible    = true
		}
		else if( m.isFrowning ){

			m.frown.visible = true
			m.mm.visible    = false
			if( m.frown.bounds ){//  ie. Did the SVG finish loading?

				m.frown.bounds.width  = GMOJI.ease( m.frown.bounds.width,  Math.max( mouthMinWidth,  person.mouth.inner.trueWidth  * 1.5 ))
				m.frown.bounds.height = GMOJI.ease( m.frown.bounds.height, Math.max( mouthMinHeight, person.mouth.inner.trueHeight * 1.5 ))
				m.frown.bounds.center = GMOJI.plot( 0, 0.5 )
			}
		}
		else {

			m.frown.visible = false
			m.mm.visible    = true

			var
			centerRel = person.mouth.center.relativeSegments[ 1 ].point.clone(),
			centerAbs = m.mm.position.clone()


			//  Left corner of mouth.

			delta = centerRel.y - person.mouth.center.relativeSegments[ 2 ].point.y
			x     = centerAbs.x - ( person.scale * 50 + Math.abs( delta ) * 5 )
			y     = centerAbs.y - delta * 4
			y    -= person.scale * 2//  Forced smile.
			m.mm.segments[ 2 ].point = GMOJI.easePoint( m.mm.segments[ 2 ].point, new paper.Point( x, y ))


			//  Right corner mouth.

			delta = centerRel.y - person.mouth.center.relativeSegments[ 0 ].point.y
			x     = centerAbs.x + ( person.scale * 50 + Math.abs( delta ) * 5 )
			y     = centerAbs.y - delta * 4
			y    -= person.scale * 2//  Forced smile.
			m.mm.segments[ 0 ].point = GMOJI.easePoint( m.mm.segments[ 0 ].point, new paper.Point( x, y ))


			//  Fix the center handles.

			m.mm.segments[ 1 ].handleIn  = [( m.mm.segments[ 0 ].point.x - m.mm.segments[ 1 ].point.x ) * 0.66, 0 ]
			m.mm.segments[ 1 ].handleOut = [( m.mm.segments[ 2 ].point.x - m.mm.segments[ 1 ].point.x ) * 0.66, 0 ]
		}
	}




	//  Mouth is open, but what expression to show? And how?!

	else {

		m.mm.visible = false
		if( m.isSmilingBig ){

			m.smile.visible = true
			m.oh.visible    = false
			m.ah.visible    = false
			if( m.smile.bounds ){//  ie. Did the SVG finish loading?
				
				m.smile.bounds.width  = m.smileWidth
				m.smile.bounds.height = m.smileHeight
				m.smile.bounds.center = GMOJI.plot( 0, m.smileY )
			}
		}
		else if( m.isSayingOh ){

			m.smile.visible = false
			m.oh.visible    = true
			m.ah.visible    = false
			if( m.oh.bounds ){//  ie. Did the SVG finish loading?

				m.oh.bounds.width  = m.smileWidth
				m.oh.bounds.height = m.smileHeight
				m.oh.bounds.center = GMOJI.plot( 0, m.smileY )
			}
		}
		else {

			m.smile.visible = false
			m.oh.visible    = false
			m.ah.visible    = true
			if( this.mouth.defaultType === 'svg' ){

				m.ah.bounds.width  = m.smileWidth
				m.ah.bounds.height = m.smileHeight
				m.ah.bounds.center = GMOJI.plot( 0, m.smileY )
			}
		}
	}




	    //////////////
	   //          //
	  //   Eyes   //
	 //          //
	//////////////


	function updateEyes( side ){

		var
		personEye      = person[ 'eye'+ side ],
		personEyebrow  = person[ 'eyebrow'+ side ],
		puppetEye      = puppet[ 'eye'+ side ],
		puppetEyeScale = puppetEye.children.normal.scaleAbsoluteX,
		otherSide      = side === 'Left' ? 'Right' : 'Left'


		//  Should we trigger a wink or release-wink animation?

		if( personEye.isClosed   >=  0.6  &&
			puppetEye.isScrunch  !== true &&
			// puppetEye.isMoonUp   !== true &&
			// puppetEye.isMoonDown !== true
			( puppetEye.isNormal === undefined || puppetEye.isNormal === true )){

			puppet.eyeScrunchOn( side )
		}
		else if( personEye.isClosed <= 0.4 &&
			puppetEye.isScrunch === true ){

			puppet.eyeScrunchOff( side )
		}


		//  Expressive (bulging!) eyes....

		if( puppetEye.isBulging === false &&
			personEyebrow.relativeSegments[ 2 ].point.y * -1 > 60 &&//  The arch of the eyebrow.
			puppetEye.isNormal === true ){

			puppet.eyeBulgeOn( side )
			puppet.eyeBulgeOn( otherSide )
		}
		if( puppetEye.isBulging === true &&
			personEyebrow.relativeSegments[ 2 ].point.y * -1 < 55 ){//  The arch of the eyebrow.

			puppet.eyeBulgeOff( side )
			puppet.eyeBulgeOff( otherSide )
		}
	}
	updateEyes( 'Left' )
	updateEyes( 'Right' )




	    ////////////////
	   //            //
	  //   Extras   //
	 //            //
	////////////////


	//  Staring contest.

	el = document.getElementById( 'stressed' )
	if( m.isClosed &&
		this.eyeLeft.children.normal.visible  === true &&
		this.eyeRight.children.normal.visible === true &&
		this.isKissing !== true &&
		mouthAspect < 3.8 ){

		if( this.isStaringContest !== true ){

			this.isStaringContestTimer = Date.now()
			this.isStaringContest = true
		}
		else if( !GMOJI.isIdle  && Date.now() - this.isStaringContestTimer > 1000 * 3 ){

			this.doSweat()
		}
		else if(!GMOJI.isIdle  &&  Date.now() - this.isStaringContestTimer > 1000 * 2 ){

			if( el.classList.contains( 'active' ) === false ) el.classList.add( 'active' )
		}
	}
	else {

		if( el.classList.contains( 'active' )) el.classList.remove( 'active' )
		this.isStaringContest = false
	}




	    ////////////////
	   //            //
	  //   Finish   //
	 //            //
	////////////////


	this.face.scaleTo( this.scale )
	this.face.rotateTo( this.angle )
	person.face.bringToFront()
}
