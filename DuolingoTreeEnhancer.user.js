// ==UserScript==
// @name         Duolingo Tree Enhancer
// @namespace    https://github.com/camiloaa/duolingotreeenhancer
// @version      0.6.2
// @description  Enhance trees by customizing difficulty and providing extra functionality. Check https://github.com/camiloaa/duolingotreeenhancer
// @author       Guillaume Brunerie, Camilo Arboleda
// @match        https://www.duolingo.com/*
// @icon         https://raw.githubusercontent.com/camiloaa/duolingotreeenhancer/master/duolingo.png
// @require      https://github.com/camiloaa/GM_config/raw/master/gm_config.js
// @downloadURL  https://github.com/camiloaa/duolingotreeenhancer/raw/master/DuolingoTreeEnhancer.user.js
// @updateURL  https://github.com/camiloaa/duolingotreeenhancer/raw/master/DuolingoTreeEnhancer.user.js
// @grant        none
// ==/UserScript==

console.debug('Duolingo: Tree Enhancer');

var sentenceGlobal = null;
var enableTTSGlobal = true;
var duo_languages = JSON.parse('{"gu":"Gujarati","ga":"Irish","gn":"Guarani (Jopará)","gl":"Galician","la":"Latin","tt":"Tatar","tr":"Turkish","lv":"Latvian","tl":"Tagalog","th":"Thai","te":"Telugu","ta":"Tamil","yi":"Yiddish","dk":"Dothraki","de":"German","db":"Dutch (Belgium)","da":"Danish","uz":"Uzbek","el":"Greek","eo":"Esperanto","en":"English","zc":"Chinese (Cantonese)","eu":"Basque","et":"Estonian","ep":"English (Pirate)","es":"Spanish","zs":"Chinese","ru":"Russian","ro":"Romanian","be":"Belarusian","bg":"Bulgarian","ms":"Malay","bn":"Bengali","ja":"Japanese","or":"Oriya","xl":"Lolcat","ca":"Catalan","xe":"Emoji","xz":"Zombie","cy":"Welsh","cs":"Czech","pt":"Portuguese","lt":"Lithuanian","pa":"Punjabi (Gurmukhi)","pl":"Polish","hy":"Armenian","hr":"Croatian","hv":"High Valyrian","ht":"Haitian Creole","hu":"Hungarian","hi":"Hindi","he":"Hebrew","mb":"Malay (Brunei)","mm":"Malay (Malaysia)","ml":"Malayalam","mn":"Mongolian","mk":"Macedonian","ur":"Urdu","kk":"Kazakh","uk":"Ukrainian","mr":"Marathi","my":"Burmese","dn":"Dutch","af":"Afrikaans","vi":"Vietnamese","is":"Icelandic","it":"Italian","kn":"Kannada","zt":"Chinese (Traditional)","as":"Assamese","ar":"Arabic","zu":"Zulu","az":"Azeri","id":"Indonesian","nn":"Norwegian (Nynorsk)","no":"Norwegian","nb":"Norwegian (Bokmål)","ne":"Nepali","fr":"French","fa":"Farsi","fi":"Finnish","fo":"Faroese","ka":"Georgian","ss":"Swedish (Sweden)","sq":"Albanian","ko":"Korean","sv":"Swedish","km":"Khmer","kl":"Klingon","sk":"Slovak","sn":"Sindarin","sl":"Slovenian","ky":"Kyrgyz","sf":"Swedish (Finland)","sw":"Swahili"}');
var activeclass = "";
var DuoState = JSON.parse(localStorage.getItem('duo.state'));
var targetLang = DuoState.user.learningLanguage;
var sourceLang = DuoState.user.fromLanguage;
var grade, challenge;

/* The color used for hiding */
var hColor = "lightgray";

/* Turns a stylesheet (as a string) into a style element */
function toStyleElem(css) {
    var style = document.createElement('style');

    style.type = 'text/css';
    if (style.styleSheet){
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    return style;
}

/* Stylesheet for the button, the error box and the show-on-click box */
var css_button_seb = toStyleElem('' +
'#reverse-tree-enhancer-button { margin-left: 10px; }\n' +
'#reverse-tree-enhancer-button.selected { background-color: purple; color: ' +
'white; border-color: purple; }\n' +
'#reverse-tree-enhancer-button.selected:hover { background-color: #A000A0; border-color: #A000A0; }\n' +
'\n' +
'#sound-error-box { left: 50%; transform: translate(-50%, 0); top: 20px; ' +
'color: #FF3333; font-weight: bold; }\n' +
'#sound-error-box .tooltip-inner { color: #FF3333; font-weight: bold; }\n' +
'#sound-error-box button { padding: 5px 10px; border: none; border-radius: 100px; }\n' +
'#sound-error-box button:hover { background-color: #EEE; }\n' +
'\n' +
'.ttt-hide, .ttt-not-hide:not(:hover) { color: ' + hColor + '; background-color: ' + hColor + '; }\n' +
'.ttt-hide bdi, .ttt-not-hide:not(:hover) bdi { display: none; }');

document.head.appendChild(css_button_seb);

/* Stylesheet for the hiding for the multiple-choice questions */
var css_hiding_source = toStyleElem('._1SfYc:not(:hover) '
		+ '{ color: lightgray; background-color: lightgray; '
		+ 'border-color: lightgray; } \n'
		+ '.KRKEd:not(:hover) '
		+ '{ color: lightgray; background-color: lightgray; '
		+ 'border-color: lightgray; } \n'
		+ '_1Zqmf:not(:hover) '
		+ '{ color: lightgray; background-color: lightgray; '
		+ 'border-color: lightgray; } \n'
		);

var css_hiding_target = toStyleElem('._1SfYc:not(:hover) '
		+ '{ color: lightgray; background-color: lightgray; '
		+ 'border-color: lightgray; } \n'
		+ '._31nDg:not(:hover) '
		+ '{ color: lightgray; background-color: lightgray; '
		+ 'border-color: lightgray; } \n'
		);

var css_hiding_pics = toStyleElem('._1o8rO '
		+ '{ color: lightgray; background-color: lightgray; '
		+ 'border-color: lightgray; opacity: 0; } \n'
		);

function addCSSHiding(css_hiding) {
	console.log("Hiding " + css_hiding);
	document.head.appendChild(css_hiding);
}

function removeCSSHiding(css_hiding) {
    document.head.appendChild(css_hiding);
    document.head.removeChild(css_hiding);
}

/* Sound Error box */
var soundErrorBox = document.createElement('div');
soundErrorBox.className = "tooltip top";
soundErrorBox.id = "sound-error-box";
soundErrorBox.innerHTML = '<div class="tooltip-inner">' +
'Error when loading the sound, click <a id="sound-error-link" target="_blank">here</a> ' +
'and try to fix the problem. <button id="sound-error-button">Done</button></div>';

function tryagain() {
    hideSoundErrorBox();
    audio.load();
}

function hideSoundErrorBox() {
    soundErrorBox.style.display = "none";
}

function displaySoundErrorBox(url) {
    var container = document.getElementsByClassName("player-container")[0];
    container.insertBefore(soundErrorBox, container.firstChild);
    document.getElementById("sound-error-link").href = url;
    soundErrorBox.style.display = "";
    document.getElementById("sound-error-button").onclick = tryagain;
}

/* Audio functions */

var audio;
var prevAudio;
var waiting = false;

// Play an audio element.
function playURL(url) {

	console.log("Playing URL " + url);
	audio = document.getElementById("audio-userscript-cm");

	if (audio != null) {
		// Delete audio element
		document.body.parentNode.removeChild(audio);
	}
	audio = document.createElement('audio');
	audio.setAttribute("id", "audio-userscript-cm")
	audio.setAttribute("autoplay", "true")
	source = document.createElement('source');
	source.setAttribute("type", "audio/mpeg");
	audio.appendChild(source);
	document.body.parentNode.insertBefore(audio, document.body);
	source.setAttribute("src", url);

	audio.load();
}

// Play a sentence using the first available TTS
function playSound(sentence, lang) {
	var url = "";
	for (i = 0; i < sayFuncOrder.length; i++) {
		try {
			// console.log("loop " + sayFuncOrder[i]);
			if (sayFunc[sayFuncOrder[i]](sentence, lang)) {
				break;
			}
		} catch (err) {
			// Do nothing, I don't care
		}
	}
}

// Google TTS Functions
// ====================
//
function googleTTSLang(target) {
    if (target == "dn") { return "nl"; }
    if (target == "zs") { return "zh"; }
    return target;
}

function googleSay(sentence, lang) {

	// Create Google TTS in a way that it doesn't get tired that quickly.
	var gRand = function() {
		return Math.floor(Math.random() * 1000000) + '|'
				+ Math.floor(Math.random() * 1000000)
	};
	url = "http://translate.google.com/translate_tts?ie=UTF-8&tl="
			+ googleTTSLang(lang) + "&total=1&textlen=" + sentence.length
			+ "&tk=" + gRand() + "&q=" + encodeURIComponent(sentence)
			+ "&client=tw-ob";
	playURL(url);
	return true;
}

// Yandex TTS Functions
// ====================
//
function yandexTTSLang(target) {
	switch (target) {
	case 'ar': return 'ar_AE';
	case 'ca': return 'ca_ES';
	case 'cs': return 'cs_CZ';
	case 'da': return 'da_DK';
	case 'de': return 'de_DE';
	case 'el': return 'el_GR';
	case 'en': return 'en_GB';
	case 'es': return 'es_ES';
	case 'fi': return 'fi_FI';
	case 'fr': return 'fr_FR';
	case 'it': return 'it_IT';
	case 'dn': return 'nl_NL';
	case 'no': return 'no_NO';
	case 'pl': return 'pl_PL';
	case 'pt': return 'pt_PT';
	case 'ru': return 'ru_RU';
	case 'se': return 'sv_SE';
	case 'tr': return 'tr_TR';
	}
	return undefined;
};

function yandexSay(sentence, lang) {
	var sayLang = yandexTTSLang(lang);
	// console.log("Yandex " + sayLang);
	if (sayLang != undefined) {
		url = 'http://tts.voicetech.yandex.net/tts?text='
				+ encodeURIComponent(sentence) + '&lang=' + sayLang
				+ '&format=mp3&quality=hi';
		playURL(url);
		return true;
	}
	return false;
};

// Baidu TTS Functions
// ====================

// Duolingo to Baidu language codes
function baiduTTSLang(lang) {
	switch (lang) {
	case 'en': return 'en'; // American English
	case 'es': return 'es'; // Spanish
	case 'pt': return 'pt'; // Portuguese
	case 'zs': return 'zh'; // Chinese
	}
	return undefined;
};

function baiduSay(sentence, lang) {
	var sayLang = baiduTTSLang(lang);
	if (sayLang != undefined) {
		url = 'http://tts.baidu.com/text2audio?text='
				+ encodeURIComponent(sentence) + '&lan=' + sayLang
				+ '&ie=UTF-8';
		playURL(url);
		return true;
	}
	return false;
}

function ansObserver() {
	url = tts_ans.getAttribute("data-value");
	playURL(url);
}

// List of supported TTS providers
var sayFunc = new Array();
sayFunc['baidu'] = baiduSay;
sayFunc['google'] = googleSay;
sayFunc['yandex'] = yandexSay;
var sayFuncOrder = [ 'baidu', 'yandex', 'google', ];

// Say a sentence
function say(itemsToSay, lang) {
	var sentence = "";
	for (var i = 0; i < itemsToSay.length; ++i) {
		var text = itemsToSay[i].type == "textarea" ? itemsToSay[i].textContent
				: itemsToSay[i].innerText;
		sentence = sentence + text + ". ";
	}

	sentence = sentence.replace(/•/g, "");
	sentence = sentence.replace(/\.\./g, ".");

	// console.log("Duolingo Tree Enhancer: language '" + lang + "'");
	console.log("Duolingo Tree Enhancer: saying '" + sentence + "'");
	sentenceGlobal = sentence;
	playSound(sentence, lang);
	lastSaidLang = lang;
}

function keyUpHandler(e) {
	if (e.shiftKey && e.keyCode == 82 && audio) {
		audio.play();
	}
}

document.addEventListener('keyup', keyUpHandler, false);

/* Functions acting on the various types of exercices */

/* Translation from target language (eg. Polish) */
function challengeTranslate() {
	var questionBox = challenge.getElementsByClassName("_38VWB");

	var input_area = challenge.getElementsByTagName("textarea")[0];
    lang = input_area.getAttribute("lang");
    if (isCheckSpell()) {
    	input_area.setAttribute("spellcheck", "true");
    }

	if (lang == targetLang) {
		question = sourceLang;
		answer = targetLang;
		css_hiding = css_hiding_source;
	} else {
		question = targetLang;
		answer = sourceLang;
		css_hiding = css_hiding_target;
	}
	
	if (isHideText(question)) {
		addCSSHiding(css_hiding);
	} else {
		removeCSSHiding(css_hiding);
	}
	
	// console.log("challengeTranslate from "+question+" to "+answer);
	if (/answer/.test(activeclass)) {
		removeCSSHiding(css_hiding);
		// Read the answer aloud if necessary
		if ((grade.length > 0) && isSayText(answer)) {
			say(grade, answer);
		}
		
	} else {
		// Read the question aloud if no TTS is available
		// We know there is not TTS because there is no play button
		speak_button = challenge.getElementsByClassName("_2GN1p _1ZlfW");
		if ((speak_button.length == 0) && isSayText(question)) {
			say(questionBox, question);
		}
	}

}

/* Multiple-choice translation question */
function challengeJudge() {
	var textCell = challenge.getElementsByClassName("KRKEd");

	if (!document.getElementById("timer") && isHideTranslations()) {
		addCSSHiding(css_hiding_target);
	} else {
		removeCSSHiding(css_hiding_target);
	}

	if (/answer/.test(activeclass)) {
		console.log("Callenge Judge answer");
		removeCSSHiding(css_hiding_source);
		removeCSSHiding(css_hiding_target);
		if (grade.length == 0) { // Answer is right
			ansStatus = challenge.getElementsByClassName("BblGF _2zVZG");
			ansText = challenge.getElementsByClassName("_3EaeX _2zVZG");

			for (var i = 0; i < ansStatus.length; ++i) {
				if (ansStatus[i].firstChild.checked == true) {
					ansText[i].className = "_3EaeX _2zVZG valid-ans";
				}
			}

			grade = challenge.getElementsByClassName("_3EaeX _2zVZG valid-ans");
		}

		if (isSayText(targetLang))
			say(grade, targetLang);
	} else {
		console.log("Callenge Judge question");
		if (isHideText(sourceLang)) {
			addCSSHiding(css_hiding_source);
		}

		if (isSayText(sourceLang)) {
			say(textCell, sourceLang);
		}
	}
}

var quotMark = /(["“”「」])/;

/* Select the correct image */
function challengeSelect() {
	if (isHidePics()) {
		addCSSHiding(css_hiding_pics);
	} else {
		removeCSSHiding(css_hiding_pics);
	}

	if (/answer/.test(activeclass)) {
		removeCSSHiding(css_hiding_pics);
	} else {
		textCell = challenge.getElementsByClassName("_1Zqmf");
		if (isSayText(sourceLang)) {
			say(textCell, sourceLang);
		}
		
	}
}

/* Type the word corresponding to the images */
function challengeName() {
	if (isHidePics()) {
		addCSSHiding(css_hiding_pics);
	} else {
		removeCSSHiding(css_hiding_pics);
	}

	if (/answer/.test(activeclass)) {
		removeCSSHiding(css_hiding_pics);
	} else {
		textCell = challenge.getElementsByClassName("_1Zqmf");
		if (isSayText(sourceLang)) {
			say(textCell, sourceLang);
		}
	}
}

/*
 * Multiple-choice question where we have to choose a word in the source
 * language. Those are useless exercices, but we can’t get rid of them.
 */
function challengeForm() {
	if (/answer/.test(activeclass)) {
	} else {
	}
}

function challengeListen()
{
	if (/answer/.test(activeclass)) {
//		if (isSayText(sourceLang))
//			say(grade, sourceLang);
	} else {
        if (isCheckSpell()) {
        	var input_box = challenge.getElementsByTagName("input")[0];
            input_box.setAttribute("spellcheck", "true");
            input_box.setAttribute("lang", targetLang);
        }
	}
}

function setUserConfig() {
	var autoplay = isSayText(targetLang);
	var microphone = isSpeaking();
	var speakers = isListening();
	DuoState.user.enableMicrophone = microphone;
	DuoState.user.enableSpeaker = speakers;

	// This was reverse engineered, might stop working any time
	url = "/2016-04-13/users/";
	fields = "?fields=%2Cautoplay%2CenableMicrophone%2CenableSpeaker";
	params = '{"":"","autoplay":' + autoplay + ',"enableMicrophone":'
			+ microphone + ',"enableSpeaker":' + speakers + '}';

	http = new XMLHttpRequest();
	http.open("PATCH", url + DuoState.user.id + fields, true);

	// Send the proper header information along with the request
	// http.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	// http.setRequestHeader("Content-length", params.length);
	// http.setRequestHeader("Connection", "keep-alive");
	// http.setRequestHeader("Cookie", document.cookie);

	http.onreadystatechange = function() {// Call a function when the state
											// changes.
		if (http.readyState == 4 && http.status == 200) {
			console.log("Updated Setup " + params);
		}
	}

	// console.log("About to send config");
	http.send(params);
}

function updateConfig() {
	var item = "gm_conf-" + sourceLang + "-" + targetLang;
	var conf = {
		id : item, // The id used for this instance of GM_config
		title : 'Enhanced Tree Configurator',
		fields : // Fields object
		{
			'SECTION_0' : {
				'section' : [ '', '' ],
				'type' : 'hidden'
			},
			'IS_ENHANCED' : { // Choose a pre-defined profile
				'label' : 'Select the kind of tree you want to play:',
				'options' : [ 'Normal', 'Reverse', 'Enhanced', 'Laddering' ],
				'default' : 'Normal', // Do nothing by default
				'change' : function() {
					setConfigDefaults(this[this.selectedIndex].value);
				},
				'type' : 'select', // Makes this setting a dropdown
			},
			'SECTION_1' : {
				'section' : [ '', 'Hide questions in:' ],
				'type' : 'hidden'
			},
			'HIDE_TARGET' : { // Hide questions in Duo's target language
				'section' : [],
				'labelPos' : 'right',
				'label' : duo_languages[targetLang], // SECTION_2
				'type' : 'checkbox',
				'default' : false
			},
			'HIDE_SOURCE' : { // Hide questions in Duo's source language
				'label' : duo_languages[sourceLang],
				'labelPos' : 'right',
				'type' : 'checkbox',
				'default' : false
			},
			'HIDE_TRANSLATIONS' : {
				'label' : 'Multiple selection',
				'labelPos' : 'right',
				'type' : 'checkbox',
				'default' : false
			},
			'SECTION_3' : {
				'section' : [ '', 'Read text in:' ],
				'type' : 'hidden'
			},
			'READ_TARGET' : { // Read text in Duo's target language
				'section' : [], // SECTION_4
				'label' : duo_languages[targetLang],
				'labelPos' : 'right',
				'type' : 'checkbox',
				'default' : true
			},
			'READ_SOURCE' : // Read text in Duo's target language
			{
				'label' : duo_languages[sourceLang],
				'labelPos' : 'right',
				'type' : 'checkbox',
				'default' : false
			},
			'LISTENING' : {
				'label' : 'Listening exercises',
				'labelPos' : 'right',
				'type' : 'checkbox',
				'default' : true
			},
			'SECTION_5' : {
				'section' : [ '', 'Other options' ],
				'type' : 'hidden'
			},
			'HIDE_PICS' : {
				'section' : [], // SECTION_6
				'label' : 'Hide pics',
				'labelPos' : 'right',
				'type' : 'checkbox',
				'default' : false
			},
			'SPELL_CHECK' : {
				'label' : 'Check spelling',
				'labelPos' : 'right',
				'type' : 'checkbox',
				'default' : false
			},
			'SPEAKING' : {
				'label' : 'Speaking exercises',
				'labelPos' : 'right',
				'type' : 'checkbox',
				'default' : true
			},
			'SECTION_7' : {
				'section' : [ '', '' ],
				'type' : 'hidden'
			},
			'TTS_ORDER' : {
				'label' : 'List of TTS services ',
				'labelPos' : 'left',
				'type' : 'text', // Makes this setting a text field
				'default' : 'google yandex baidu'
			},
		},
		full_css : [
				"#GM_config * * { font: 500 15px/20px 'museo-sans-rounded',sans-serif; "
						+ "margin-right: 6px; color: #333 }",
				"#GM_config { background: #FFF; }",
				"#GM_config input[type='radio'] { margin-right: 8px; }",
				"#GM_config .indent40 { margin-left: 40%; }",
				"#GM_config .field_label { margin-right: 6px; }",
				"#GM_config .radio_label { font-size: 12px; }",
				"#GM_config .block { display: block; }",
				"#GM_config .saveclose_buttons { margin: 16px 10px 10px; padding: 2px 12px; }",
				"#GM_config .reset, #GM_config .reset a,"
						+ " #GM_config_buttons_holder { color: #000; text-align: right; }",
				"#GM_config .config_header { font-size: 20pt; margin:0px; color: white; background: "
				        + "rgba(32, 166, 231, 0.8) linear-gradient(to bottom, #20A8E9, "
				        + "rgba(30, 158, 220, 0.5)) "
				        + "repeat-x scroll 0% 0%; border: 10px solid rgba(32, 166, 231, 0.8); }",
				"#GM_config .config_desc, #GM_config .section_desc, #GM_config .reset { font-size: 9pt; }",
				"#GM_config .center { text-align: center; }",
				"#GM_config .section_header_holder { margin-top: 8px; }",
				"#GM_config .config_var { margin: 0 0 4px; }",
				"#GM_config .section_header { background: #F0F0F0; border: 1px solid #CCC; "
						+ "color: #404040; font-size: 11pt; margin: 0; text-align: left; }",
				"#GM_config .section_desc { background: #F0F0F0; border: 1px solid #CCC; color: #404040;"
						+ " font-size: 11pt; margin: 0 0 6px; text-align: left; }",
				"#GM_config_section_0 .config_var, #GM_config_section_7 .config_var "
						+ " { background: #F0F0F0; border: 1px solid #CCC; color: #404040;"
						+ " font-size: 11pt; margin: 0 0 6px; text-align: left; }",
				"#GM_config_section_2 .config_var, "
						+ "#GM_config_section_4 .config_var, "
						+ "#GM_config_section_6 .config_var "
						+ "{ margin: 5% !important;display: inline !important; }", ]
				.join('\n')
				+ '\n',
		events : { // Callback functions object
			save : function() {
				GM_config.close()
			},
			close : function() {
				getConfig();
			},
			open : function() {
				this.frame.setAttribute('style','bottom: auto; border: 1px solid #000;'
						  + ' display: none; height: 60%; left: 0; margin: 0; max-height: 95%;'
						  + ' max-width: 95%; opacity: 0; overflow: auto; padding: 0;'
						  + ' position: fixed; right: auto; top: 0; width: 70%; z-index: 9999;');
			}
		}
	};
	GM_config = new GM_configStruct();
	GM_config.init(conf);
	sayFuncOrder = GM_config.get('TTS_ORDER').split(" ");

	console.log("Duolingo Tree Enhancer ready from " + sourceLang
    		+ " to " + targetLang);
};

function setConfigDefaults(treeType)
{
    switch (treeType) {
    case 'Normal':
        GM_config.fields['HIDE_TARGET'].value = false;
        GM_config.fields['HIDE_SOURCE'].value = false;
        GM_config.fields['READ_TARGET'].value = true;
        GM_config.fields['READ_SOURCE'].value = false;
        GM_config.fields['LISTENING'].value = true;
        GM_config.fields['SPEAKING'].value = true;
        GM_config.fields['HIDE_PICS'].value = false;
        GM_config.fields['SPELL_CHECK'].value = false;
        GM_config.fields['HIDE_TRANSLATIONS'].value = false;
        break;

    case 'Reverse':
        GM_config.fields['HIDE_TARGET'].value = false;
        GM_config.fields['HIDE_SOURCE'].value = true;
        GM_config.fields['READ_TARGET'].value = false;
        GM_config.fields['READ_SOURCE'].value = true;
        GM_config.fields['LISTENING'].value = false;
        GM_config.fields['SPEAKING'].value = false;
        GM_config.fields['HIDE_PICS'].value = true;
        GM_config.fields['SPELL_CHECK'].value = true;
        GM_config.fields['HIDE_TRANSLATIONS'].value = true;
        break

    case 'Enhanced':
        GM_config.fields['HIDE_TARGET'].value = true;
        GM_config.fields['HIDE_SOURCE'].value = false;
        GM_config.fields['READ_TARGET'].value = true;
        GM_config.fields['READ_SOURCE'].value = false;
        GM_config.fields['LISTENING'].value = true;
        GM_config.fields['SPEAKING'].value = true;
        GM_config.fields['HIDE_PICS'].value = false;
        GM_config.fields['SPELL_CHECK'].value = true;
        GM_config.fields['HIDE_TRANSLATIONS'].value = false;
        break;

    case 'Laddering':
        GM_config.fields['HIDE_TARGET'].value = true;
        GM_config.fields['HIDE_SOURCE'].value = true;
        GM_config.fields['READ_TARGET'].value = true;
        GM_config.fields['READ_SOURCE'].value = true;
        GM_config.fields['LISTENING'].value = true;
        GM_config.fields['SPEAKING'].value = true;
        GM_config.fields['HIDE_PICS'].value = false;
        GM_config.fields['SPELL_CHECK'].value = true;
        GM_config.fields['HIDE_TRANSLATIONS'].value = false;
        break;

    default:
        break;
    }

    GM_config.fields['HIDE_TARGET'].reload();
    GM_config.fields['HIDE_SOURCE'].reload();
    GM_config.fields['READ_TARGET'].reload();
    GM_config.fields['READ_SOURCE'].reload();
    GM_config.fields['LISTENING'].reload();
    GM_config.fields['SPEAKING'].reload();
    GM_config.fields['HIDE_PICS'].reload();
    GM_config.fields['SPELL_CHECK'].reload();
    GM_config.fields['HIDE_TRANSLATIONS'].reload();
}

function showConfig() {
    GM_config.open();
}

function getConfig() {
	// Keep a list of reverse trees
    var item = sourceLang + "-" + targetLang;

    sayFuncOrder = GM_config.get('TTS_ORDER').split(" ");

    // Read the current TTS preferences
    var hasEnhancement = GM_config.get('HIDE_TARGET')
            || GM_config.get('HIDE_SOURCE') || GM_config.get('SPELL_CHECK')
            || GM_config.get('READ_SOURCE') || GM_config.get('HIDE_PICS');
    if (!isEnhancedTree() && hasEnhancement) {
        GM_config.set('IS_ENHANCED', "Enhanced");
    } else if (!hasEnhancement) {
        GM_config.set('IS_ENHANCED', "Normal");
    }
    updateButton();
    GM_config.save();  // Won't return
}

/* Function dealing with the button on the home page */
function isReverseTree() {
    return GM_config.get('IS_ENHANCED') == 'Reverse';
}

function isEnhancedTree() {
    return GM_config.get('IS_ENHANCED') != 'Normal';
}

function isHidePics() {
    return GM_config.get('HIDE_PICS');
}

function isHideTranslations() {
    return GM_config.get('HIDE_TRANSLATIONS');
}

function isCheckSpell() {
    return GM_config.get('SPELL_CHECK');
}

function isHideText(from) {
    if (targetLang == from)
        return GM_config.get('HIDE_TARGET');
    else
        return GM_config.get('HIDE_SOURCE');
}

function isSayText(from) {
    if (targetLang == from)
        return (GM_config.get('READ_TARGET') && enableTTSGlobal);
    else
        return (GM_config.get('READ_SOURCE') && enableTTSGlobal);
}

function isListening() {
	return (GM_config.get(['LISTENING']));
}

function isSpeaking() {
	return (GM_config.get(['SPEAKING']));
}

function updateButton() {
    var button = document.getElementById("reverse-tree-enhancer-button");
    if(button === null){ return; }
    if(isEnhancedTree()) {
        button.textContent = GM_config.get('IS_ENHANCED') + " tree!";
        button.className = "_3LN9C _3QG2_ _1vaUe _3IS_q _1XnsG _1vaUe _3IS_q";
    } else {
        button.textContent = "Normal tree";
        button.className = "_3LN9C _3QG2_ _1vaUe _3IS_q _1XnsG _1vaUe _3IS_q";
    }
}

/* Get a grade from mutations */
function getGrade(mutations) {
	// By default, we get an empty collection here
	grade = document.getElementsByClassName("_34Ym5");
	for (var i = 0; i < mutations.length; ++i) {
		mutation = mutations[i];
		if (mutation.type === 'childList') {
			var target = mutation.target;
			var footer_correct = target.getElementsByClassName("t55Fx _1cuVQ");
			// var footer_incorrect = target.getElementsByClassName("YhrsP
			// _1cuVQ");

			if (/challenge/.test(activeclass) && target.className == "_1l6NK") {

				for (var j = 0; j < mutation.addedNodes.length; ++j) {
					// was a child added with ID of 'bar'?
					var added_class = mutation.addedNodes[j].className;
					if (added_class == "_3rrAo _1RUUp") {
						// console.log("We got an answer");
						if (grade.length == 0 && footer_correct.lenth != 0) {
							// console.log("You are right no alt answer");
							grade = document
									.getElementsByClassName("_7q434 _1qCW5 _3cX7c _3LmPy _3Z8Ye vvZSt");
						}
						return " answer";
					}
				}

			}
		}
	}
	return "";
}

/* Function dispatching the changes in the page to the other functions */
function onChange(mutations) {
	var newclass = "";

	// General setup
	DuoState = JSON.parse(localStorage.getItem('duo.state'));
	newSourceLang = DuoState.user.fromLanguage;
	newTargetLang = DuoState.user.learningLanguage;

	if (newSourceLang != sourceLang || newTargetLang != targetLang) {
		setUserConfig();
		location.reload();
	}

	if (window.location.pathname == "/"
			&& !document.getElementById("reverse-tree-enhancer-button")) {
		var tree = document.getElementsByClassName("mAsUf")[0];
		var button = document.createElement("button");

		// Update DuoState
		targetLang = DuoState.user.learningLanguage;
		sourceLang = DuoState.user.fromLanguage;

		button.id = "reverse-tree-enhancer-button";
		button.onclick = showConfig;
		button.className = "_3LN9C _3QG2_ _1vaUe _3IS_q _1XnsG _1vaUe _3IS_q";
		button.style = "margin-left: 5px; height: 42px;";
		tree.insertBefore(button, tree.firstChild);
		updateConfig(); // Make GM_Config point to this language setup
		updateButton(); // Read setup
		setUserConfig();
	}

    var challenges = document.getElementsByClassName("_1eYrt");
    if (challenges.length > 0) {
    	newclass = challenges[0].getAttribute("data-test");
    	newclass = newclass + getGrade(mutations);

        if (newclass != activeclass) {
            // console.log("New class: " + newclass + ", old class: " + activeclass);
            activeclass = newclass;

            hideSoundErrorBox();

            if (!isEnhancedTree()) {
                removeCSSHiding();
                return;
            } else {
                // console.log("Reverse and hide");
            }

            if (challenges.length == 0) {
            	return;
            }

            challenge = challenges[0];

            if (/translate/.test(newclass)) {
                challengeTranslate();
            }

            if (/judge/.test(newclass)) {
                challengeJudge();
            }
            if (/select/.test(newclass)) {
                challengeSelect();
            }
            if (/name/.test(newclass)) {
                challengeName();
            }
            if (/form/.test(newclass)) {
                challengeForm();
            }
            if (/listen/.test(newclass)) {
            	challengeListen();
            }
        }
    }

    if(/certification_test/.test(newclass)) {
        enableTTSGlobal = false;
    } else {
        enableTTSGlobal = true;
    }

    if (/slide-session-end/.test(newclass)) {
        // End screen ("you beat the clock...").
        // Destroy the reference to the audio object
        // so that subsequent <S-Space> keypresses
        // don't cause the audio to repeat in, e.g., the tree or discussions.
        audio = null;
    }
}

new MutationObserver(onChange).observe(document.body, {
	childList : true,
	subtree : true
});

updateConfig();
