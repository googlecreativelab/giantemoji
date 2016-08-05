// Copyright 2016 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//         http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include "ofApp.h"

//--------------------------------------------------------------
void ofApp::setup(){

    // Use frontal facing camera
	grabber.setDeviceID(1);
	grabber.setPixelFormat(OF_PIXELS_MONO);
	grabber.setup(1280,720);

    // Receive orientation of camera on device
    cameraOrientation = ((ofxAndroidVideoGrabber*)grabber.getGrabber().get())->getCameraOrientation();

    // Setup mobile vision
    vision.setup();

    // Setup LandmarkTracker instance
	tracker.setup();

    // Setup (ofxBiquadFilter) filters
	smileTooltip.setFc(0.02);
	smileFilter.setFc(0.02);

	leftEyeTooltip.setFc(0.02);
	leftEyeFilter.setFc(0.02);

	rightEyeTooltip.setFc(0.02);
	rightEyeFilter.setFc(0.02);

    // Load graphics and fonts
	font.load("RobotoMono-Regular.ttf",24);

	for(int i=1;i<6;i++){
		statImages[i-1].load("icons_01-0"+ofToString(i)+".png");
	}
    positionFaceImage.load("positionFace.png");

	// Load splashscreen movie
	loadingVideo.load("splashscreen.mp4");

	loadingVideo.setLoopState(OF_LOOP_NONE);
    loadingVideo.play();

    // Load settings Java settings pane
    updateSettings();
}




//--------------------------------------------------------------
void ofApp::update(){
	if(!tracker.trackerInited){
		loadingVideo.update();
	}

	grabber.update();

	float smileProbability = -1;
	float leftEyeOpenProbability = -1;
	float rightEyeOpenProbability = -1;

	if(grabber.isFrameNew()) {

        // Calculate the face orientation relative to camera orientation
		int o = (appOrientation+cameraOrientation)%360;
		tracker.setFaceRotation(o);

        // Let the tracker run on the new pixels (will happen in the background)
		tracker.analyze(grabber.getPixels());

        // Let mobile vision run on the new pixels
		if(useMobileVision) {
			vision.update(grabber.getPixels());
			if(vision.getFaces().size() > 0){
				auto face = vision.getFaces()[0];
				smileProbability = face.smileProbability;
				leftEyeOpenProbability = face.leftEyeOpenProbability;
				rightEyeOpenProbability = face.rightEyeOpenProbability;
			}
		}
	}


    // Check if face tracker has new data, if so prepare the JSON package send it to the webview
	if(tracker.update()){
		// Receive new data
		landmarks = tracker.getLandmarksProcessed();
		landmarksInternal = tracker.getLandmarksProcessedInternal();

		// Calculate orientation of face (not really used)
		ofVec3f orientation = ofVec3f() * tracker.getMatrix() - (ofVec3f(0,0,1) * tracker.getMatrix());

        // Construct script
		string script = "";
		script = "ofTracker({";
		script += "smile:" + ofToString(smileProbability,1) + ",";
		script += "leftEye:" + ofToString(leftEyeOpenProbability,1) + ",";
		script += "rightEye:" + ofToString(rightEyeOpenProbability,1) + ",";
		script += "classifier_big_smile:" + ofToString(tracker.getBigSmile(),2) + ",";
		script += "classifier_small_smile:" + ofToString(tracker.getSmile(),2) + ",";
		script += "classifier_neutral:" + ofToString(tracker.getNeutral(),2) + ",";
		script += "classifier_o:" + ofToString(tracker.getO(),2) + ",";

		script += "orientation:{x:"+ofToString(orientation.x,3)+",y:"+ofToString(orientation.y,3)+",z:"+ofToString(orientation.z,3)+"},";

		script += "landmarks:[";
		if (landmarks.size() > 0) {
			for (auto p : landmarks) {
				script += "{x:" + ofToString(p.x / grabber.getWidth(), 3) + ", y:" +
						  ofToString(p.y / grabber.getHeight(), 3) + "},";
			}
		}
		script += "]});";

        // Evaluate the script in the webview
		evalJs(script);
	}

	// Update lowpass filter for eye open probability
    leftEyeFilter.update(ofClamp(leftEyeOpenProbability,0,1));
    rightEyeFilter.update(ofClamp(rightEyeOpenProbability,0,1));
}


//--------------------------------------------------------------
void ofApp::draw() {
    // Draw loading video while loading
	if(!tracker.trackerInited){
		ofBackground(255);
		loadingVideo.draw(drawableRectangleWithin(ofRectangle(0,0,ofGetWidth(),ofGetHeight()), loadingVideo));
		return;
	}

	ofBackground(0);

	// Calculate UI position variables
	int colwidth = 400;
	int colheight = 58;
	ofColor boxColor = ofColor(0,0,0,50);
	ofColor uiColor = ofColor(252, 194, 25);
	float rectSize = 0.65f * MIN(ofGetWidth(), ofGetHeight());;

	float w = ofGetWidth();
	float h = ofGetHeight();
	float vaspect = w / h;
	float gaspect = grabber.getWidth() / grabber.getHeight();

	ofPushMatrix();
	{
		// Prepare location and rotation of camera view (counter rotate for the cameras orientation)
		int o = (appOrientation + cameraOrientation) % 360;
        ofTranslate(w * 0.5f, h * 0.5f);
		ofRotate(-o);

		if (o != 0) {
			vaspect = 1.0f / vaspect;
		}

        // Calculate the relative scale of the grabber
		float scale;
		if (vaspect > gaspect) {
			scale = w / grabber.getWidth();
		} else {
			scale = h / grabber.getHeight();
		}

		ofScale(-1, 1);
		ofTranslate(-grabber.getWidth() * 0.5f * scale, -grabber.getHeight() * 0.5f * scale);

        // Draw the camera view (dimmed)
        ofPushMatrix(); {
			ofScale(scale);
			ofSetColor(180);
			grabber.draw(0, 0, grabber.getWidth(), grabber.getHeight());
		} ofPopMatrix();

        // Draw landmarks if any
		if (landmarks.size() > 0) {
			ofSetColor(uiColor);

			ofPushMatrix();
			{
				ofScale(scale);

				// Outer mouth
                consecutiveLandmarksPolyline(48, 60, true).draw();

				// Eyebrow
                consecutiveLandmarksPolyline(17, 22).draw();
                consecutiveLandmarksPolyline(22, 27).draw();

				// Eye
                consecutiveLandmarksPolyline(36, 42, true).draw();
                consecutiveLandmarksPolyline(42, 48, true).draw();
			}
			ofPopMatrix();

            // Draw individual landmarks with circles
			for (auto p : landmarksInternal) {
				ofDrawCircle(p * scale, 4);
			}
		}

	}
	ofPopMatrix();


	// Text UI
	ofPushMatrix();
	{
		ofTranslate(ofGetWidth() * 0.08f, ofGetHeight() * 0.3f);

		ofTranslate(0, 55);

		for (int i = 0; i < 5; i++) {
			ofSetColor(boxColor);
			ofDrawRectangle(0, 0, colwidth, colheight);
			ofSetColor(0);

			string str1;
			float val;
			switch (i) {
				case 0:
					str1 = "RIGHT EYE";
					val= 1-rightEyeFilter.value();
					break;
				case 1:
					str1 = "LEFT EYE";
					val = 1-leftEyeFilter.value();
					break;
				case 2:
					str1 = "BIG SMILE";
					val = tracker.getBigSmile();
					break;
				case 3:
					str1 = "SMALL SMILE";
					val = tracker.getSmile();
					break;
				case 4:
					str1 = "OOO MOUTH";
					val = tracker.getO();
					break;
			}

			ofSetColor(255);
			font.drawString(str1, 0, -8);
			statImages[i].draw(0,0,100, colheight);

			if(landmarks.size() == 0) val = 0;

			ofDrawLine(125,colheight/2, colwidth - 25, colheight/2);
			ofSetRectMode(OF_RECTMODE_CENTER);
			ofNoFill();
			ofDrawCircle(120,colheight/2, 6);
			ofDrawCircle(colwidth - 20,colheight/2, 7);
			ofSetRectMode(OF_RECTMODE_CORNER);
			ofFill();

			ofSetColor(uiColor);
			ofDrawRectangle(130,colheight/2-10, (colwidth-160)*val, 20);


			ofTranslate(0, colheight*2);
		}


	}
	ofPopMatrix();

	// Draw UI overlay framing area that the face should be positioned in.
	ofSetColor(uiColor);
	if(ofGetWidth() > ofGetHeight()) { // Ignore this on portrait phones
		if (landmarks.size() == 0) {
			// Draw image asking audience to step forward to the camera
			positionFaceImage.draw(
					drawableRectangleWithin(ofRectangle(0, 0, ofGetWidth(), ofGetHeight()),
											positionFaceImage));
		} else {
			float lineLength = 100;
			ofPushMatrix();
			ofTranslate(ofGetWidth() * 0.5, ofGetHeight() * 0.5);
			ofDrawLine(-rectSize * 0.5, -rectSize * 0.5, -rectSize * 0.5 + lineLength,
					   -rectSize * 0.5);
			ofDrawLine(-rectSize * 0.5, -rectSize * 0.5, -rectSize * 0.5,
					   -rectSize * 0.5 + lineLength);

			ofDrawLine(rectSize * 0.5, -rectSize * 0.5, rectSize * 0.5 - lineLength,
					   -rectSize * 0.5);
			ofDrawLine(rectSize * 0.5, -rectSize * 0.5, rectSize * 0.5,
					   -rectSize * 0.5 + lineLength);

			ofDrawLine(rectSize * 0.5, rectSize * 0.5, rectSize * 0.5, rectSize * 0.5 - lineLength);
			ofDrawLine(rectSize * 0.5, rectSize * 0.5, rectSize * 0.5 - lineLength, rectSize * 0.5);

			ofDrawLine(-rectSize * 0.5, rectSize * 0.5, -rectSize * 0.5,
					   rectSize * 0.5 - lineLength);
			ofDrawLine(-rectSize * 0.5, rectSize * 0.5, -rectSize * 0.5 + lineLength,
					   rectSize * 0.5);

			ofPopMatrix();
		}
	}



}

//--------------------------------------------------------------
// Run javascript code directly in the inline webview and streamed to remote browesers connected
void ofApp::evalJs(string js){
    JNIEnv * threadEnv = ofGetJNIEnv();

    jobject activity = ofGetOFActivityObject();
    jclass activityClass = threadEnv->FindClass("cc/openframeworks/gmoji/GmojiActivity");
    jmethodID ev = threadEnv->GetMethodID(activityClass,"evalJs","(Ljava/lang/String;)V");

    jstring jStringParam = threadEnv->NewStringUTF(js.c_str());
    threadEnv->CallVoidMethod(activity,ev, jStringParam);
    threadEnv->DeleteLocalRef(jStringParam);
}

//--------------------------------------------------------------
// Get a polyline of the landmarks from start to end
ofPolyline ofApp::consecutiveLandmarksPolyline(int start, int end, bool close) {
    if(landmarks.size()<=end){
        return ofPolyline();
    }

    int n = end - start;
    ofPolyline l;
    for(int i = 0; i < n; i++) {
        l.addVertex(landmarksInternal[start + i]);
    }
    if(close) l.close();
    return l;
}

//--------------------------------------------------------------
// Calculate centered rectangle that encapsulates drawable
ofRectangle ofApp::drawableRectangleWithin(ofRectangle rect, ofBaseDraws & drawable){
	float drawableAspect = drawable.getWidth() / drawable.getHeight();
	float rectAspect = rect.getWidth() / rect.getHeight();

	if(drawableAspect > rectAspect){
		float h = rect.getWidth() * (1.0f/drawableAspect);
		return ofRectangle(0, (rect.getHeight() - h)/2.0f,
						   rect.getWidth(), h);
	} else {
		float w = rect.getHeight() * drawableAspect;
		return ofRectangle((rect.getWidth() - w)/2.0f, 0,
						   w, rect.getHeight());
	}
}

//--------------------------------------------------------------
// Get values from settings
void ofApp::updateSettings(){
	JNIEnv * threadEnv = ofGetJNIEnv();

	jobject activity = ofGetOFActivityObject();//threadEnv->GetStaticObjectField(OFAndroid,ofActivityID);
	jclass activityClass = threadEnv->FindClass("cc/openframeworks/gmoji/GmojiActivity");
	useMobileVision = threadEnv->CallBooleanMethod(activity,threadEnv->GetMethodID(activityClass,"useMobileVision","()Z"));
	float s = threadEnv->CallFloatMethod(activity,threadEnv->GetMethodID(activityClass,"getSmoothingPreference","()F"));
	tracker.setSmoothing(s);
}

void ofApp::deviceOrientationChanged(ofOrientation newOrientation){
	appOrientation = ofOrientationToDegrees(newOrientation);
}

//--------------------------------------------------------------
// Tap for debug view
void ofApp::touchDown(int x, int y, int id){
	evalJs("GMOJI.toggleDebug();");
}


//--------------------------------------------------------------
// Double tap in upper left corner for settings
void ofApp::touchDoubleTap(int x, int y, int id){
	if(x < 200 && y < 200) {
		JNIEnv *threadEnv = ofGetJNIEnv();
		jobject activity = ofGetOFActivityObject();
		jclass activityClass = threadEnv->FindClass("cc/openframeworks/gmoji/GmojiActivity");
		threadEnv->CallVoidMethod(activity, threadEnv->GetMethodID(activityClass, "toggleUi", "()V"));
	}
}

//--------------------------------------------------------------
void ofApp::resume(){
    updateSettings();
}


//--------------------------------------------------------------
bool ofApp::backPressed(){
	return false;
}
