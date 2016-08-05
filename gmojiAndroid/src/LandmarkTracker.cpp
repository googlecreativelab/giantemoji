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

#include "LandmarkTracker.h"

void LandmarkTracker::setup(){
    startThread();

    newFrame = true;
    trackerInited = false;

    // Setup filters
    for(int i=0;i<68;i++){
        auto f = ofxBiquadFilter2f();
        f.setFc(0.19);
        filters.push_back(f);

        auto f2 = ofxBiquadFilter2f();
        f2.setFc(0.2);
        internalFilters.push_back(f2);
    }

    neutralValue.setFc(0.1);
    smallSmileValue.setFc(0.1);
    bigSmileValue.setFc(0.1);
    oValue.setFc(0.1);
    faceNotFoundCounter = 100;

    // Load pre trained SVM classification functions
    learned_functions = vector<pfunct_type>(4);
    dlib::deserialize(ofToDataPath("data_ecstatic_smile.func")) >> learned_functions[0];
    dlib::deserialize(ofToDataPath("data_small_smile.func")) >> learned_functions[1];
    dlib::deserialize(ofToDataPath("data_o.func")) >> learned_functions[2];
    dlib::deserialize(ofToDataPath("data_neutral.func")) >> learned_functions[3];

}

LandmarkTracker::~LandmarkTracker(){
    // when the class is destroyed
    // close both channels and wait for
    // the thread to finish
    toAnalyze.close();
    fromAnalyze.close();
    waitForThread(true);
}

void LandmarkTracker::setFaceRotation(int  o){
    tracker.setFaceRotation(o);
    faceRotation = o;
}

void LandmarkTracker::setSmoothing(float s){
    for(auto & f : filters){
        f.setFc(s);
    }
}

void LandmarkTracker::analyze(ofPixels &pixels) {
    if(toAnalyze.empty()) {
        toAnalyze.send(pixels);
    }
}

// Background thread
void LandmarkTracker::threadedFunction() {
    ofPixels p;
    while(toAnalyze.receive(p)) {
        // Setup tracker on the background thread first time its run
        if(!trackerInited){
            try {
                tracker.setup();
                trackerInited = true;
            } catch(...){
                error = "Could not load tracker binary";
            }
        }

        AnalyzeResult l = AnalyzeResult();
        cv::Mat cvImg = ofxCv::toCv(p);

        float maxH = cvImg.rows;
        float maxW = cvImg.cols;
        if(faceRotation != 0 || faceRotation != 180){
            float maxH = cvImg.rows;
            float maxW = cvImg.cols;

        }

        roi = cv::Rect(0,0,0,0);

        // If its seeing a face, then consentrate tracker on where the face is for
        // faster tracking performance
        if(tracker.size() > 0){
            tracker.setFaceDetectorImageSize(22000);

            ofRectangle r = tracker.getInstances()[0].getBoundingBox();
            roi.x = r.x-r.width*0.5;
            roi.y = r.y-r.height*0.25;
            roi.width = r.width+r.width;
            roi.height = r.height+r.height*0.5;
        } else {
            // Else widen the tracking area
            tracker.setFaceDetectorImageSize(25000);

//            roi.width = cvImg.cols * 0.5;
//            roi.y = roi.height*0.1;
//            roi.height = cvImg.rows*0.8;

            roi.width = maxW;
            roi.height = maxH;

            roi.x = 0;
            roi.y = 0;
        }



        // Clamp ROI
        roi.x = MIN(MAX(roi.x, 0),maxW-1) ;
        roi.width = MAX(1,MIN(roi.width, maxW - roi.x));

        roi.y = MIN(MAX(roi.y, 0),maxH-1) ;
        roi.height = MAX(1,MIN(roi.height, maxH - roi.y));


        // Run the face tracker
        tracker.update(cvImg, roi);

        if (tracker.size() > 0) {
            faceNotFoundCounter = 0;

            // Update filters with new tracker data
            int i=0;
            for (auto point : tracker.getInstances()[0].getLandmarks().getImagePoints()) {
                filters[i].update(point);
                internalFilters[i].update(point);
                l.landmarks.push_back(point);
                l.landmarksProcessed.push_back(filters[i].value());
                l.landmarksProcessedInternal.push_back(internalFilters[i].value());
                i++;
            }
            l.matrix = lastMatrix = tracker.getInstances()[0].getPoseMatrix();

            l.big_smile = bigSmileValue.update(learned_functions[0](makeSample()));
            l.smile = smallSmileValue.update(learned_functions[1](makeSample()));
            l.o = oValue.update(learned_functions[2](makeSample()));
            l.neutral = neutralValue.update(learned_functions[3](makeSample()));

        } else {
            // If there is no face found, update filters it with old values
            faceNotFoundCounter ++;
            if(faceNotFoundCounter < 10){

                for (int i=0;i<filters.size();i++) {
                    filters[i].update(filters[i].value());
                    internalFilters[i].update(internalFilters[i].value());
                    l.landmarks.push_back(filters[i].value());
                    l.landmarksProcessed.push_back(filters[i].value());
                    l.landmarksProcessedInternal.push_back(internalFilters[i].value());
                }
                l.matrix = lastMatrix;

                l.big_smile = bigSmileValue.value();
                l.smile = smallSmileValue.value();
                l.neutral = neutralValue.value();
                l.o = oValue.value();
            }
        }

        // Send new data to main thread
        fromAnalyze.send(l);
    }
}



// Function that generates a sample for the SVM classification based on a list of predefined landmarks
sample_type LandmarkTracker::makeSample(){

    auto outer = tracker.getInstances()[0].getLandmarks().getImageFeature(ofxFaceTracker2Landmarks::OUTER_MOUTH);
    auto inner = tracker.getInstances()[0].getLandmarks().getImageFeature(ofxFaceTracker2Landmarks::INNER_MOUTH);

    auto lEye = tracker.getInstances()[0].getLandmarks().getImageFeature(ofxFaceTracker2Landmarks::LEFT_EYE);
    auto rEye = tracker.getInstances()[0].getLandmarks().getImageFeature(ofxFaceTracker2Landmarks::RIGHT_EYE);

    ofVec2f vec = rEye.getCentroid2D() - lEye.getCentroid2D();
    float rot = vec.angle(ofVec2f(1,0));

    vector<ofVec2f> relativeMouthPoints;

    ofVec2f centroid = outer.getCentroid2D();
    for(ofVec2f p : outer.getVertices()){
        p -= centroid;
        p.rotate(rot);
        p /= vec.length();

        relativeMouthPoints.push_back(p);
    }

    for(ofVec2f p : inner.getVertices()){
        p -= centroid;
        p.rotate(rot);
        p /= vec.length();

        relativeMouthPoints.push_back(p);
    }

    sample_type s;
    for(int i=0;i<20;i++){
        s(i*2+0) = relativeMouthPoints[i].x;
        s(i*2+1) = relativeMouthPoints[i].y;
    }
    return s;
}



bool LandmarkTracker::update() {
    newFrame = false;

    // Try and receive new data from background thread
    while(fromAnalyze.tryReceive(analyzeResult)){
        newFrame = true;
    }
    return newFrame;
}

vector<ofVec2f> LandmarkTracker::getLandmarksProcessed(){
    vector<ofVec2f> copy(analyzeResult.landmarksProcessed);
    return copy;
}

vector<ofVec2f> LandmarkTracker::getLandmarksProcessedInternal(){
    vector<ofVec2f> copy(analyzeResult.landmarksProcessedInternal);
    return copy;
}

float LandmarkTracker::getSmile(){
    return analyzeResult.smile;
}
float LandmarkTracker::getBigSmile(){
    return analyzeResult.big_smile;
}
float LandmarkTracker::getNeutral(){
    return analyzeResult.neutral;
}
float LandmarkTracker::getO(){
    return analyzeResult.o;
}

ofMatrix4x4 LandmarkTracker::getMatrix(){
    return analyzeResult.matrix;
}
