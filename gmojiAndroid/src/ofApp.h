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

#pragma once

#include "ofMain.h"
#include "ofxAndroid.h"

#include "ofxBiquadFilter.h"
#include "ofxAndroidMobileVision.h"

#include "LandmarkTracker.h"

class ofApp : public ofxAndroidApp {
public:
	void setup();
	void update();
	void draw();

	void evalJs(string js);
	void updateSettings();

	ofRectangle drawableRectangleWithin(ofRectangle rect, ofBaseDraws & drawable);

	ofPolyline consecutiveLandmarksPolyline(int start, int end, bool close = false);

	ofVideoGrabber grabber;

	int cameraOrientation;
	int appOrientation;

	bool useMobileVision;
	ofxAndroidMobileVision vision;

	LandmarkTracker tracker;

	vector< glm::vec2> landmarks;
	vector< glm::vec2> landmarksInternal;

	vector<ofxBiquadFilter2f> mouth;

	ofxBiquadFilter3f center;

	ofxBiquadFilter2f smileTooltip;
	ofxBiquadFilter1f smileFilter;

	ofxBiquadFilter2f leftEyeTooltip;
	ofxBiquadFilter1f leftEyeFilter;

	ofxBiquadFilter2f rightEyeTooltip;
	ofxBiquadFilter1f rightEyeFilter;

	ofImage positionFaceImage;
	ofImage statImages[6];
	ofTrueTypeFont font;

	ofVideoPlayer loadingVideo;


	// Android stuff
	void touchDown(int x, int y, int id);
	void touchDoubleTap(int x, int y, int id);
	void resume();
	bool backPressed();
	void deviceOrientationChanged(ofOrientation newOrientation);

	jobject activity;
};
