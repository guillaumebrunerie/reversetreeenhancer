// ==UserScript==
// @name         MicrosoftTTSListener
// @namespace    https://gist.github.com/camiloaa
// @version      0.1
// @description  Use Multiple TTS for Duolingo
// @match        https://www.duolingo.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

BingTTS_clientid=localStorage.getItem("BingTTS-clientid");
BingTTS_secret=localStorage.getItem("BingTTS-secret");
BingTTS_key=undefined;
BingBaseURL='http://api.microsofttranslator.com/V2/http.svc/Speak?';

function requestMSKey() {
	console.log("Time for new key");

	GM_xmlhttpRequest({
		method : "POST",
		url : "https://datamarket.accesscontrol.windows.net/v2/OAuth2-13",
		headers : {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		data : "client_id=" + BingTTS_clientid + "&client_secret=" + BingTTS_secret +
        "&scope=http%3A%2F%2Fapi.microsofttranslator.com&grant_type=client_credentials",
		onload : function(response) {
			/*{"error":"invalid_request",
			 * "error_description":"ACS90011: The required field 'client_secret' is missing.\r\nTrace ID: a527b08d-569f-4610-90b6-192c7a5c3558\r\nCorrelation ID: 845eaac4-788a-4771-a420-d7da30269827\r\nTimestamp: 2016-01-07 14:16:30Z"}

			 * {"token_type":"http://schemas.xmlsoap.org/ws/2009/11/swt-token-profile-1.0","access_token":"http%3a%2f%2fschemas.xmlsoap.org%2fws%2f2005%2f05%2fidentity%2fclaims%2fnameidentifier=536ac4c2-e6f0-4983-b01d-14192002d379&http%3a%2f%2fschemas.microsoft.com%2faccesscontrolservice%2f2010%2f07%2fclaims%2fidentityprovider=https%3a%2f%2fdatamarket.accesscontrol.windows.net%2f&Audience=http%3a%2f%2fapi.microsofttranslator.com&ExpiresOn=1452176895&Issuer=https%3a%2f%2fdatamarket.accesscontrol.windows.net%2f&HMACSHA256=koR%2fPmNbD7p%2fAfieb6bvxUorM7P8p%2bkHuE9Gi5C9brU%3d","expires_in":"600","scope":"http://api.microsofttranslator.com"}
			 * */
			var token = JSON.parse(response.responseText);
			if (response.status != 200) {
				console.log("The error " + JSON.stringify(token));
				return; // Don't set a new key. Some error handling is necessary
			}
			// console.log("The result " + JSON.stringify(token));
	        BingTTS_key=token.access_token;
	        setTimeout(requestMSKey, 950 * token.expires_in ); // Ask for a new key before this one expires
		},
		onerror : function(msg) {
	    	console.log("Error" + JSON.stringify(msg));
	    	BingTTS_key=undefined;
	    },
		ontimeout : function(msg) {
	    	console.log("Error" + JSON.stringify(msg));
	    	BingTTS_key=undefined;
	    },
		timeout : 6000
	});
};


/* Audio functions */

var audio;
var prevAudio;
var waiting = false;
var counter = 0;

function playSound(url, slow) {
	console.log(url);
	sound = new Audio(url);
	console.log(JSON.stringify(url));
	sound.play();
}

function testBingTTS() {
	GM_xmlhttpRequest({
		  method: "GET",
		  url: "https://api.microsofttranslator.com/v2/ajax.svc/Speak?appid=&language=pl&format=audio/mp3&options=MaxQuality&text=cze%C5%9B%C4%87%20Agnieszka%2C%20jak%20si%C4%99%20masz%3F",
		  headers: {
			    "Authorization": "Bearer " + BingTTS_key
			    },
		  onload: function(response) {
			url = response.response.replace(/\"/g,"");
			url = url.replace(/\\/g,"");
			setTimeout(function(){playSound(url);}, 500);
			console.log("Ok, no hard errors");
		  }
		});
}

function bingURL(sentence) {
	bingurl = "https://api.microsofttranslator.com/v2/ajax.svc/Speak?appid=&format=audio/mp3&options=MaxQuality&" + sentence;
	console.log("say this bing " + bingurl);
	GM_xmlhttpRequest({
		  method: "GET",
		  url: bingurl,
		  headers: {
			    "Authorization": "Bearer " + BingTTS_key
			    },
		  onload: function(response) {
			url = response.response.replace(/\"/g,"");
			url = url.replace(/\\/g,"");
			console.log("Ok, no hard errors "+url);
			answer = document.getElementById("bing-tts-answer");
			answer.setAttribute("data-value", url);
		  }
		});
}

function ISOLang(targetLang) {
    if (targetLang == "dn") { return "nl"; }
    if (targetLang == "zs") { return "zh"; }
    return targetLang;
};

var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
var observerConfig = { 
	  	attributes: true, 
	  	childList: true, 
	  	subree: true,
	  };

setTimeout(function() {
	requestObserver = new MutationObserver(myObserver);
	request = document.getElementById("bing-tts-request");
	requestObserver.observe(request, observerConfig);
}, 4000);
requestMSKey();

function myObserver() {
	console.log("CHANGES!")
	request = document.getElementById("bing-tts-request");
	bingURL(request.getAttribute("data-value"));
}

