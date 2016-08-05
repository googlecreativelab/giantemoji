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


//
// The LandmarkTracker is an object that is running in the background doing landmark detection
// using ofxFaceTracker2, doing custom smile classification using DLIB, and filters the landmarks
// using a biquad filter with ofxBiquadFilter.
//

#pragma once
#include "ofMain.h"
#include "ofxFacetracker2.h"
#include "ofxBiquadFilter.h"

struct AnalyzeResult {
    vector<ofVec2f> landmarks;
    vector<ofVec2f> landmarksProcessed;
    vector<ofVec2f> landmarksProcessedInternal;
    ofMatrix4x4 matrix;
    double smile, big_smile, neutral, o;
};

// Setup typedefs required for the DLIB SVM functions used to classify smiles
typedef dlib::matrix<double,40,1> sample_type;
typedef dlib::radial_basis_kernel<sample_type> kernel_type;

typedef dlib::decision_function<kernel_type> dec_funct_type;
typedef dlib::normalized_function<dec_funct_type> funct_type;

typedef dlib::probabilistic_decision_function<kernel_type> probabilistic_funct_type;
typedef dlib::normalized_function<probabilistic_funct_type> pfunct_type;


class LandmarkTracker : public ofThread {
public:

    void setup();
    ~LandmarkTracker();

    void analyze(ofPixels & pixels);
    bool update();

    vector<ofVec2f> getLandmarksProcessed();
    vector<ofVec2f> getLandmarksProcessedInternal();
    ofMatrix4x4 getMatrix();

    float getSmile();
    float getBigSmile();
    float getNeutral();
    float getO();

    void setSmoothing(float s);

    void setFaceRotation(int o);

    bool trackerInited;

private:
    void threadedFunction();
    sample_type makeSample();

    ofxFaceTracker2 tracker;
    string error;
    bool newFrame;
    int faceNotFoundCounter;

    int faceRotation;

    vector<ofxBiquadFilter2f> filters;
    vector<ofxBiquadFilter2f> internalFilters;

    ofxBiquadFilter1f neutralValue;
    ofxBiquadFilter1f smallSmileValue;
    ofxBiquadFilter1f bigSmileValue;
    ofxBiquadFilter1f oValue;

    cv::Rect roi;

    ofThreadChannel<ofPixels> toAnalyze;
    ofThreadChannel<AnalyzeResult > fromAnalyze;

    AnalyzeResult analyzeResult;

    vector<pfunct_type> learned_functions;

    ofMatrix4x4 lastMatrix;

};

