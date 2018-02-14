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

package cc.openframeworks.gmoji;

import android.app.ActionBar;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.os.Handler;
import android.os.PowerManager;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.net.URISyntaxException;
import java.text.ParseException;

import cc.openframeworks.OFAndroid;



public class GmojiActivity extends cc.openframeworks.OFActivity{

	private WebView mWebView;
	private SharedPreferences sharedPref;

	private Socket mSocket;

	private PowerManager.WakeLock wl;

	@Override
	public void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);

		// Setup webview
		mWebView = (WebView) findViewById(R.id.webView);
		if(mWebView != null) {
			mWebView.setWebViewClient(new WebViewClient());
			WebView.setWebContentsDebuggingEnabled(true);
			mWebView.getSettings().setJavaScriptEnabled(true);
			mWebView.getSettings().setAllowFileAccess(true);
			mWebView.getSettings().setAllowFileAccessFromFileURLs(true);
		}

		// Force screen orientation
		if(getResources().getBoolean(R.bool.portrait_only)){
			setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
		} else if(getResources().getBoolean(R.bool.landscape_only)){
			setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
		}

		// Hide action bar
		ActionBar actionBar = getActionBar();
		if (actionBar != null) {
			actionBar.hide();
		}
	}

	@Override
	protected void onPause() {
		super.onPause();
		wl.release();
		if(mSocket != null && mSocket.connected()){
			mSocket.disconnect();
		}
	}

	@Override
	protected void onResume() {
		super.onResume();

		// Make sure device doesnt sleep
		PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
		wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "GMOJI");
		wl.acquire();

		// Get shared preferences
		sharedPref = PreferenceManager.getDefaultSharedPreferences(this);

		// Determine if webview should be visible
		boolean showEmoji = sharedPref.getBoolean("show_web_preference", false);
		if(showEmoji){
			mWebView.setVisibility(View.VISIBLE);
			updateWebView();
		} else {
			mWebView.setVisibility(View.GONE);
			mWebView.loadUrl("");
		}

		// Determine URL of remote socket
		boolean customurl = sharedPref.getBoolean("checkbox_preference", false);
		if(customurl) {
			String url = sharedPref.getString("edittext_preference", "");
			if (url.length() > 0) {
				try {
					Log.i("SOCKET", "connecting to " + url);
					mSocket = IO.socket(url.toLowerCase());
					mSocket.connect();
				} catch (URISyntaxException e) {
					Log.e("SOCKET", "Could not connect to socket " + e.getMessage());
				}
			}
		}

		// Setup view decoration
		View decorView = getWindow().getDecorView();
		final int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
				| View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
				| View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
				| View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
				| View.SYSTEM_UI_FLAG_FULLSCREEN
				| View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;

		decorView.setSystemUiVisibility(flags);
	}

	public void evalJs(final String script){
		if(mSocket != null) {
			mSocket.emit("eval", script);
		}

		if(mWebView != null && mWebView.getVisibility() == View.VISIBLE) {
			mWebView.post(new Runnable() {
				@Override
				public void run() {
					mWebView.evaluateJavascript(script, null);
				}
			});
		}
	}


	// Toggle preferences UI visibility
	private boolean uiVisible = true;
	public void toggleUi(){
		Intent i = new Intent(this, PreferencesActivity.class);
		startActivity(i);
	}

	// Read preferences
	public boolean useMobileVision(){
		sharedPref = PreferenceManager.getDefaultSharedPreferences(this);
		return sharedPref.getBoolean("mobilevision_preference", true);
	}

	public float getSmoothingPreference(){
		sharedPref = PreferenceManager.getDefaultSharedPreferences(this);
		float f = 0.2f;
		try {
			f = Float.parseFloat(sharedPref.getString("smoothing_preference", "0.2"));
		} catch(NumberFormatException ignored){}

		return f;
	}


	//
	private void updateWebView(){
		if(mWebView != null) {
			sharedPref = PreferenceManager.getDefaultSharedPreferences(this);
			boolean showEmoji = sharedPref.getBoolean("show_web_preference", false);
			if(showEmoji) {
				boolean customurl = sharedPref.getBoolean("checkbox_preference", false);
				if (customurl) {
					String url = sharedPref.getString("edittext_preference", "");
					mWebView.loadUrl(url);
				} else {
					mWebView.loadUrl("file:///android_asset/index.html");
				}
			} else {
				mWebView.loadUrl("");
			}
		}
	}

	@Override
	public void onDetachedFromWindow() {
	}

	// Menus
	// http://developer.android.com/guide/topics/ui/menus.html
	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Create settings menu options from here, one by one or infalting an xml
		//return super.onCreateOptionsMenu(menu);
		MenuInflater inflater = getMenuInflater();
		inflater.inflate(R.menu.main_layout, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// This passes the menu option string to OF
		// you can add additional behavior from java modifying this method
		// but keep the call to OFAndroid so OF is notified of menu events
		switch (item.getItemId()){
			case R.id.menu_settings:
				Intent i = new Intent(this, PreferencesActivity.class);
				startActivity(i);

			case R.id.menu_reload:
				updateWebView();
		}

		return super.onOptionsItemSelected(item);
	}


	@Override
	public boolean onPrepareOptionsMenu (Menu menu){
		// This method is called every time the menu is opened
		//  you can add or remove menu options from here
		return  super.onPrepareOptionsMenu(menu);
	}

}



