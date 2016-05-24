// ==UserScript==
// @name         Duolingo Tree Enhancer
// @namespace    https://github.com/camiloaa/duolingotreeenhancer
// @version      0.5.3
// @description  Enhance reverse trees by adding a TTS (Google, Baidu or Yandex) and turning most exercices into listening exercices by hiding the text in the target language.
// @author       Guillaume Brunerie, Camilo Arboleda
// @match        https://www.duolingo.com/*
// @require      https://github.com/camiloaa/GM_config/raw/master/gm_config.js
// @downloadURL  https://github.com/camiloaa/duolingotreeenhancer/raw/master/DuolingoTreeEnhancer.user.js
// @grant        none
// ==/UserScript==

console.debug('Duolingo: Tree Enhancer');

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
'#reverse-tree-enhancer-button.selected { background-color: purple; color: white; border-color: purple; }\n' +
'#reverse-tree-enhancer-button.selected:hover { background-color: #A000A0; border-color: #A000A0; }\n' +
'\n' +
'#sound-error-box { left: 50%; transform: translate(-50%, 0); top: 20px; color: #FF3333; font-weight: bold; }\n' +
'#sound-error-box .tooltip-inner { color: #FF3333; font-weight: bold; }\n' +
'#sound-error-box button { padding: 5px 10px; border: none; border-radius: 100px; }\n' +
'#sound-error-box button:hover { background-color: #EEE; }\n' +
'\n' +
'.ttt-hide, .ttt-not-hide:not(:hover) { color: ' + hColor + '; background-color: ' + hColor + '; }\n' +
'.ttt-hide bdi, .ttt-not-hide:not(:hover) bdi { display: none; }');

document.head.appendChild(css_button_seb);

/* Stylesheet for the hiding for the multiple-choice questions */
var css_hiding = toStyleElem('' +
'.list-judge-options.hover-effect:not(.nothiding) .white-label:not(:hover):not(.active) { color: ' + hColor +'; background-color: ' + hColor + '; border-color: ' + hColor + '; }\n' +
'.list-judge-options.hover-effect:not(.nothiding) .white-label:not(:hover):not(.active) input[type=checkbox] { visibility: hidden; }\n' +
'\n' +
'.select-images.hover-effect:not(.nothiding)>li:not(:hover):not(.selected) { color: ' + hColor +'; background-color: ' + hColor + '; border-color: ' + hColor + '; }\n' +
'.select-images.hover-effect:not(.nothiding)>li:not(:hover):not(.selected) input[type=radio] { visibility: hidden; }\n' +
'.select-images.hover-effect:not(.nothiding)>li:not(:hover):not(.selected) .select-images-frame { visibility: hidden; }');

function addCSSHiding() {
    document.head.appendChild(css_hiding);
}

function removeCSSHiding() {
    document.head.appendChild(css_hiding);
    document.head.removeChild(css_hiding);
}

/* Sound Error box */
var soundErrorBox = document.createElement('div');
soundErrorBox.className = "tooltip top";
soundErrorBox.id = "sound-error-box";
soundErrorBox.innerHTML = '<div class="tooltip-inner">Error when loading the sound, click <a id="sound-error-link" target="_blank">here</a> and try to fix the problem. <button id="sound-error-button">Done</button></div>';

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
var counter = 0;

// Play an audio element.
function playURL(url) {
    counter = counter + 1;
    if(prevAudio){ prevAudio.destruct(); }
    prevAudio = audio;
    waiting = (prevAudio && prevAudio.playState == 1);
    // race condition here…
    audio = soundManager.createSound({
        id: "sound-" + counter,
        url: url,
        autoLoad: true,
        onload: function() {
            if(this.readyState == 2){
                displaySoundErrorBox(this.url);
            } else if(!waiting){
                this.play();
            }
        },
        onfinish: function () {
            if(waiting) {
                waiting = false;
                this.play();
            }
        }
    });
}

// Play a sentence using the first available TTS
function playSound(sentence, lang, slow) {
	var url = "";
	for (i = 0; i < sayFuncOrder.length; i++) {
		try {
			// console.log("loop " + sayFuncOrder[i]);
			if (sayFunc[sayFuncOrder[i]](sentence, lang, slow)) {
				break;
			}
		} catch (err) {
			// Do nothing, I don't care
		}
	}
}

var sentenceGlobal = null;
var lastSaidSlow = false;

// Google TTS Functions
// ====================
//
function googleTTSLang(targetLang) {
    if (targetLang == "dn") { return "nl"; }
    if (targetLang == "zs") { return "zh"; }
    return targetLang;
}

function googleSay(sentence, lang, slow) {

    // Create Google TTS in a way that it doesn't get tired that quickly.
    var gRand = function () { return Math.floor(Math.random() * 1000000) + '|' +
                                       Math.floor(Math.random() * 1000000) };
    url = "http://translate.google.com/translate_tts?ie=UTF-8&tl=" + googleTTSLang(lang) +
          "&total=1&textlen=" + sentence.length + "&tk=" + gRand() +
          "&q=" + encodeURIComponent(sentence) + "&client=tw-ob";
    if (slow) url = url + "&ttsspeed=0"
    playURL(url);
    return true;
}

// Yandex TTS Functions
// ====================
//
function yandexTTSLang(targetLang) {
	switch (targetLang) {
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

function yandexSay(sentence, lang, speed) {
	var sayLang = yandexTTSLang(lang);
	if (sayLang != undefined) {
		url = 'http://tts.voicetech.yandex.net/tts?text=' + sentence +
			'&lang=' + sayLang + '&format=mp3&quality=hi';
		playURL(url);
		return true;
	}
	return false;
};

// Baidu TTS Functions
// ====================

// Duolingo to Baidu language codes
function baiduTTSLang(targetLang) {
	switch (targetLang) {
	case 'en': return 'en'; // American English
	case 'es': return 'es'; // Spanish
	case 'pt': return 'pt'; // Portuguese
	case 'zs': return 'zh'; // Chinese
	}
	return undefined;
};

function baiduSay(sentence, lang, speed) {
	var sayLang = baiduTTSLang(lang);
	if (sayLang != undefined) {
		url = 'http://tts.baidu.com/text2audio?text=' + sentence +
			'&lan=' + sayLang + '&ie=UTF-8';
		playURL(url);
		return true;
	}
	return false;
}

// Setup MS TTS
tts_req = document.createElement("li");
tts_ans = document.createElement("li");

function ansObserver() {
	url = tts_ans.getAttribute("data-value");
	playURL(url);
}

function BingSetup() {
	var MutationObserver = window.MutationObserver ||
	                       window.WebKitMutationObserver ||
	                       window.MozMutationObserver;
	var observerConfig = {
			attributes: true,
			childList: true,
			subree: true,
			};

	tts_req.setAttribute("type", "hidden");
	tts_req.setAttribute("id", "bing-tts-request");
	tts_req.setAttribute("data-value", " ");
	document.body.appendChild(tts_req);

	tts_ans.setAttribute("type", "hidden");
	tts_ans.setAttribute("id", "bing-tts-answer");
	tts_ans.setAttribute("data-value", " ");
	document.body.appendChild(tts_ans);

	answerObserver = new MutationObserver(ansObserver);
	answer = document.getElementById("bing-tts-answer");
	answerObserver.observe(answer, observerConfig);
}

function bingSay(sentence, lang, slow) {
	request = document.getElementById("bing-tts-request");
	url = "language=" + googleTTSLang(lang) + "&text=" + sentence;
	request.setAttribute("data-value", url);
	return true;
}

// List of supported TTS providers
var sayFunc = new Array();
sayFunc['baidu']  = baiduSay;
sayFunc['bing']   = bingSay;
sayFunc['google'] = googleSay;
sayFunc['yandex'] = yandexSay;
var sayFuncOrder = [ 'bing', 'baidu', 'yandex', 'google', ];

// Say a sentence
function say(sentence, lang) {
    sentence = sentence.replace(/•/g,"");
    console.debug("Duolingo Tree Enhancer: saying '" + sentence + "'");
    sentenceGlobal = sentence;
    playSound(sentence, lang, false);
    lastSaidSlow = false;
    lastSaidLang = lang;
}

// Repeat las sentece slowly
function sayslow(lang) {
    var sentence = sentenceGlobal;
    console.debug("Duolingo Tree Enhancer: saying slowly '" + sentence + "'");
    playSound(sentenceGlobal, lang, true);
    lastSaidSlow = true;
    lastSaidLang = lang;
}

function keyUpHandler(e) {
    if (e.shiftKey && e.keyCode == 32 && audio) {
        if (e.altKey) {
            if (lastSaidSlow) {
                audio.stop().play();
            } else {
                sayslow(lastSaidLang);
            }
        } else {
            if (lastSaidSlow) {
                say(sentenceGlobal, lastSaidLang);
            } else {
                audio.stop().play();
            }
        }
    }
}

document.addEventListener('keyup', keyUpHandler, false);

/* jQuery hack to avoid reading things in display:none, copy-pasted from StackOverflow */
function sayCell(cell, lang) {
    var t = $(cell).clone();
    $('body').append(t);
    t.find('*:not(:visible)').remove();
    t.remove();
    say(t.text(), lang);
}

/* Functions acting on the various types of exercices */

/* Translation from target language (eg. Polish) */
function challengeTranslate(lang) {
    var cell = challenge.getElementsByClassName("text-to-translate")[0];
    if (lang == targetLang) {
        question = sourceLang;
        answer = targetLang;
    } else {
        question = targetLang;
        answer = sourceLang;
    }
    console.log("challengeTranslate from "+question+" to "+answer);
    if (grade.children.length === 0) {
        if (isSayQuestion(question))
            sayCell(cell, question); // Speak only by explicit request in forward tree
        if (isHideText(question)) {
            cell.className = "text-to-translate ttt-hide";
            cell.onclick = function() {
                cell.className = "text-to-translate ttt-not-hide";
            };
        }
    } else {
        cell.className = "text-to-translate";
        cell.onclick = null
    }
    if ((grade.children.length > 0) && isSayText(answer)) {
        var betterAnswer = grade.getElementsByTagName("h1")[0].getElementsByTagName("span");
        // Hack for making timed practice work
        var isTimedPractice = (grade.getElementsByClassName("icon-clock-medium").length !== 0);
        var blame = document.getElementById("blame-1")
        var isTypo = blame && blame.offsetParent !== null
        if (isTimedPractice && !isTypo) {
            betterAnswer = [];
        }

        if (betterAnswer.length === 0) {
            say(document.getElementById("submitted-text").textContent, answer);
        } else {
            say(betterAnswer[0].textContent, answer);
        }
    }
}

/* Multiple-choice translation question */
function challengeJudge(){
    var textCell = challenge.getElementsByClassName("col-left")[0].getElementsByTagName("bdi")[0];
    var ul = challenge.getElementsByTagName("ul")[0];

    if (!document.getElementById("timer") && isHideTranslations()) {
		addCSSHiding();
	} else {
		removeCSSHiding();
	}

    if(grade.children.length === 0){
        if (isHideText(sourceLang)) {
            textCell.style.color = hColor;
            textCell.style.backgroundColor = hColor;
            textCell.style.display = "block";
        }
        
        if (isSayText(sourceLang))
            say(textCell.textContent, sourceLang);
    } else {
        textCell.style.color = "";
        textCell.style.backgroundColor = "";
        ul.className += " nothiding";
    }
}

var quotMark = /(["“”「」])/;

/* Select the correct image */
function challengeSelect(){
    var hone = challenge.getElementsByTagName("h1")[0];
    var ul = challenge.getElementsByTagName("ul")[0];
	    var span;

    if(grade.children.length === 0){
        var sp = hone.textContent.split(quotMark);
		hone.innerHTML = sp[0] + sp[1] + "<span>" + sp[2] + "</span>" + sp[3] + sp[4];
		span = hone.getElementsByTagName("span")[0];

		if (isSayText(sourceLang))
		    say(span.textContent, sourcetLang);
        if (isHideText(sourceLang)) {
			span.style.color = hColor;
			span.style.backgroundColor = hColor;
        }
    } else {
        span = hone.getElementsByTagName("span")[0];
        span.style.color = "";
        span.style.backgroundColor = "";
        ul.className += " nothiding";
    }
}

/* Type the word corresponding to the images */
function challengeName(){
    var lis = challenge.getElementsByClassName("list-tilted-images")[0].getElementsByTagName("li");
    var hone = challenge.getElementsByTagName("h1")[0];
    var span, i;
    if(grade.children.length === 0){
        var sp = hone.textContent.split(quotMark);
       	hone.innerHTML = sp[0] + sp[1] + "<span>" + sp[2] + "</span>" + sp[3] + sp[4];
		span = hone.getElementsByTagName("span")[0];

        if (isSayText(sourceLang))
            say(span.textContent, sourceLang);

        if (isHideText(sourceLang)) {
			span.style.color = hColor;
			span.style.backgroundColor = hColor;
        }
        if (isHidePics()) {
            for (i = 0; i < lis.length; i++) {
                lis[i].style.backgroundColor = hColor;
                lis[i].dataset.oldImage = lis[i].style.backgroundImage;
                lis[i].style.backgroundImage = "";
            }
        }
    } else {
        span = hone.getElementsByTagName("span")[0];
        span.style.color = "";
        span.style.backgroundColor = "";

        for(i=0; i < lis.length; i++){
            lis[i].style.backgroundImage = lis[i].dataset.oldImage;
        }
    }
}

/* Multiple-choice question where we have to choose a word in the source language.
 * Those are useless exercices, but we can’t get rid of them. */
function challengeForm(){
    if(grade.children.length !== 0){
        if (isSayText(sourceLang))
            say(grade.getElementsByTagName("h2")[0].children[1].textContent, sourceLang);
    }
}

function updateConfig() {
	var item = "gm_conf-" + duo.user.attributes.ui_language + "-"
			+ duo.user.attributes.learning_language;
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
				'label' : duo.language_names_ui['en'][targetLang], // SECTION_2
				'type' : 'checkbox',
				'default' : false
			},
			'HIDE_SOURCE' : { // Hide questions in Duo's source language
				'label' : duo.language_names_ui['en'][sourceLang],
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
				'label' : duo.language_names_ui['en'][targetLang],
				'labelPos' : 'right',
				'type' : 'checkbox',
				'default' : false
			},
			'READ_SOURCE' : // Read text in Duo's target language
			{
				'label' : duo.language_names_ui['en'][sourceLang],
				'labelPos' : 'right',
				'type' : 'checkbox',
				'default' : false
			},
			'SECTION_5' : {
				'section' : [ '', 'Other options' ],
				'type' : 'hidden'
			},
			'HIDE_PICS' : {
				'section' : [], // SECTION_6
				'label' : 'Hide pictures',
				'labelPos' : 'right',
				'type' : 'checkbox',
				'default' : false
			},
			'REPLACE_TTS' : {
				'label' : 'Replace Duo\'s TTS',
				'labelPos' : 'right',
				'type' : 'checkbox',
				'default' : false
			},
			'SECTION_7' : {
				'section' : [ '', '' ],
				'type' : 'hidden'
			},
			'TTS_ORDER' : {
				'label' : 'List of TTS services ',
				'type' : 'text', // Makes this setting a text field
				'default' : 'google yandex baidu'
			/*
			 * Bing is not listed, because it needs a developer key and a lot of
			 * hacking to work. But if you are reading this, you probably know
			 * what you are doing.
			 * 
			 * Got to MSDN and ask for a key, and then check the script
			 * MicrosoftTTSListener.user.js in this same repo to enable it!
			 */
			},
		},
		full_css : [
				"#GM_config * * { font: 500 15px/20px 'museo-sans-rounded',sans-serif; margin-right: 6px; color: #333 }",
				"#GM_config { background: #FFF; }",
				"#GM_config input[type='radio'] { margin-right: 8px; }",
				"#GM_config .indent40 { margin-left: 40%; }",
				"#GM_config .field_label { margin-right: 6px; }",
				"#GM_config .radio_label { font-size: 12px; }",
				"#GM_config .block { display: block; }",
				"#GM_config .saveclose_buttons { margin: 16px 10px 10px; padding: 2px 12px; }",
				"#GM_config .reset, #GM_config .reset a,"
						+ " #GM_config_buttons_holder { color: #000; text-align: right; }",
				"#GM_config .config_header { font-size: 20pt; margin:0px; color: white; background: rgba(32, 166, 231, 0.8) linear-gradient(to bottom, #20A8E9, rgba(30, 158, 220, 0.5)) repeat-x scroll 0% 0%; border: 10px solid rgba(32, 166, 231, 0.8); }",
				"#GM_config .config_desc, #GM_config .section_desc, #GM_config .reset { font-size: 9pt; }",
				"#GM_config .center { text-align: center; }",
				"#GM_config .section_header_holder { margin-top: 8px; }",
				"#GM_config .config_var { margin: 0 0 4px; }",
				"#GM_config .section_header { background: #F0F0F0; border: 1px solid #CCC; color: #404040; "
						+ " font-size: 11pt; margin: 0; text-align: left; }",
				"#GM_config .section_desc { background: #F0F0F0; border: 1px solid #CCC; color: #404040;"
						+ " font-size: 11pt; margin: 0 0 6px; text-align: left; }",
				"#GM_config_section_0 .config_var, #GM_config_section_7 .config_var "
						+ " { background: #F0F0F0; border: 1px solid #CCC; color: #404040;"
						+ " font-size: 11pt; margin: 0 0 6px; text-align: left; }",
				"#GM_config_section_2 .config_var, "
						+ "#GM_config_section_4 .config_var, "
						+ "#GM_config_section_6 .config_var "
						+ "{ margin: 5% !important;display: inline !important; }", 
				].join('\n') + '\n',
		events : { // Callback functions object
			save : function() {
				GM_config.close()
			},
			close : function() {
				getConfig();
			},
			open : function() {
				this.frame.setAttribute('style','bottom: auto; border: 1px solid #000; display: none; height: 50%;'
					      + ' left: 0; margin: 0; max-height: 95%; max-width: 95%; opacity: 0;'
					      + ' overflow: auto; padding: 0; position: fixed; right: auto; top: 0;'
					      + ' width: 50%; z-index: 9999;');
			}
		}
	};
	GM_config = new GM_configStruct();
	GM_config.init(conf);
	sayFuncOrder = GM_config.get('TTS_ORDER').split(" ");
};

function setConfigDefaults(treeType)
{
    switch (treeType) {
    case 'Normal':
        GM_config.fields['HIDE_TARGET'].value = false;
        GM_config.fields['HIDE_SOURCE'].value = false;
        GM_config.fields['READ_TARGET'].value = false;
        GM_config.fields['READ_SOURCE'].value = false;
        GM_config.fields['REPLACE_TTS'].value = false;
        GM_config.fields['HIDE_PICS'].value = false;
        GM_config.fields['HIDE_TRANSLATIONS'].value = false;
        break;

    case 'Reverse':
        GM_config.fields['HIDE_TARGET'].value = false;
        GM_config.fields['HIDE_SOURCE'].value = true;
        GM_config.fields['READ_TARGET'].value = false;
        GM_config.fields['READ_SOURCE'].value = true;
        GM_config.fields['REPLACE_TTS'].value = true;
        GM_config.fields['HIDE_PICS'].value = true;
        GM_config.fields['HIDE_TRANSLATIONS'].value = true;
        break

    case 'Enhanced':
        GM_config.fields['HIDE_TARGET'].value = true;
        GM_config.fields['HIDE_SOURCE'].value = false;
        GM_config.fields['READ_TARGET'].value = true;
        GM_config.fields['READ_SOURCE'].value = false;
        GM_config.fields['REPLACE_TTS'].value = false;
        GM_config.fields['HIDE_PICS'].value = false;
        GM_config.fields['HIDE_TRANSLATIONS'].value = false;
        break;

    case 'Laddering':
        GM_config.fields['HIDE_TARGET'].value = true;
        GM_config.fields['HIDE_SOURCE'].value = true;
        GM_config.fields['READ_TARGET'].value = true;
        GM_config.fields['READ_SOURCE'].value = true;
        GM_config.fields['REPLACE_TTS'].value = false;
        GM_config.fields['HIDE_PICS'].value = false;
        GM_config.fields['HIDE_TRANSLATIONS'].value = false;
        break;

    default:
        break;
    }

    GM_config.fields['HIDE_TARGET'].reload();
    GM_config.fields['HIDE_SOURCE'].reload();
    GM_config.fields['READ_TARGET'].reload();
    GM_config.fields['READ_SOURCE'].reload();
    GM_config.fields['REPLACE_TTS'].reload();
    GM_config.fields['HIDE_PICS'].reload();
    GM_config.fields['HIDE_TRANSLATIONS'].reload();
}

function showConfig() {
    GM_config.open();
}

function getConfig() {
	// Keep a list of reverse trees
    var reverseTrees = JSON.parse(localStorage.getItem("reverse_trees"));
    if(reverseTrees === null) { reverseTrees = {}; }
    var item = duo.user.attributes.ui_language + "-" + duo.user.attributes.learning_language;
    reverseTrees[item] = isReverseTree();
    localStorage.setItem("reverse_trees", JSON.stringify(reverseTrees));
    // Read the current TTS preferences
    var hasEnhancement = GM_config.get('HIDE_TARGET')
            || GM_config.get('HIDE_SOURCE') || GM_config.get('READ_TARGET')
            || GM_config.get('READ_SOURCE') || GM_config.get('HIDE_PICS');
    if (!isEnhancedTree() && hasEnhancement) {
        GM_config.set('IS_ENHANCED', "Enhanced");
    }

    sayFuncOrder = GM_config.get('TTS_ORDER').split(" ");
    updateButton();
}

/* Function dealing with the button on the home page */
function isReverseTree() {
    return GM_config.get('IS_ENHANCED') == 'Reverse';
}

function isEnhancedTree() {
    return GM_config.get('IS_ENHANCED') != 'Normal';
}

function isReplaceTTS() {
    return GM_config.get('REPLACE_TTS');
}

function isHidePics() {
    return GM_config.get('HIDE_PICS');
}

function isHideTranslations() {
    return GM_config.get('HIDE_TRANSLATIONS');
}

function isHideText(from) {
    if (targetLang == from)
        return GM_config.get('HIDE_TARGET');
    else
        return GM_config.get('HIDE_SOURCE');
}

function isSayText(from) {
    if (targetLang == from)
        return GM_config.get('READ_TARGET');
    else
        return GM_config.get('READ_SOURCE')
}

function isSayQuestion(lang)
{
    return (lang == sourceLang) && isSayText(lang);
}

function updateButton() {
    var button = document.getElementById("reverse-tree-enhancer-button");
    if(button === null){ return; }
    if(isEnhancedTree()) {
        button.textContent = GM_config.get('IS_ENHANCED') + " tree!";
        button.className = "btn btn-standard right btn-store selected";
    } else {
        button.textContent = "Normal tree";
        button.className = "btn btn-standard right btn-store";
    }
}

/* Function dispatching the changes in the page to the other functions */

var oldclass = "";
var targetLang, sourceLange;
var grade, challenge;

function onChange() {
    var newclass = document.getElementById("app").className;
    
    sourceLang = duo.user.attributes.ui_language;
    targetLang = duo.user.attributes.learning_language;
    if(/home/.test(newclass) && !document.getElementById("reverse-tree-enhancer-button")){
        var tree = document.getElementsByClassName("tree")[0];
        var button = document.createElement("button");
        button.id = "reverse-tree-enhancer-button";
        button.onclick = showConfig;
        tree.insertBefore(button, tree.firstChild);
        updateConfig(); // Make GM_Config point to this language setup
        updateButton()(); // Read setup
    }

    if (/slide-session-end/.test(newclass)) {
        // End screen ("you beat the clock...").
        // Destroy the reference to the audio object
        // so that subsequent <S-Space> keypresses
        // don't cause the audio to repeat in, e.g., the tree or discussions.
        audio = null;
    }

    if (newclass != oldclass) {
        oldclass = newclass;
        // console.debug("New class: " + newclass);

        hideSoundErrorBox();

        if (!isEnhancedTree()) {
            removeCSSHiding();
            return;
        } else {
            // console.log("Reverse and hide");
        }

        var sec = document.getElementById("session-element-container");
        if(!sec){return;}
        challenge = sec.children[0];
        grade = document.getElementById("grade");

        if (/translate/.test(newclass)) {
            lang = challenge.getElementsByTagName("textarea")[0].getAttribute("lang");
            challengeTranslate(lang);
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
    }
}

setTimeout(BingSetup, 1500);
setTimeout(updateConfig, 1000);

new MutationObserver(onChange).observe(document.body, {attributes: true, childList: true, subtree: true});

(function($) {
	if (typeof duo != 'undefined' && typeof $.tts_super == 'undefined') {
		var ttsBase = duo.tts_base_url, ttsPath = duo.tts_path;
		$.fn.tts_super = $.fn.tts;
		$.fn.tts = function(d) {
			if (d.tts_type === "sentence" && typeof d.sentence !== 'undefined' ) {
				var quoted_text = encodeURIComponent(d.sentence.replace("/"," "));
				sourceLang = duo.user.attributes.ui_language;
				targetLang = duo.user.attributes.learning_language;
				if (!isSayText(targetLang) && isEnhancedTree()) {
					return; // User-disabled TTS
				} else if (isReplaceTTS()) {
					say(quoted_text, sourceLang);
					return;
				}
				duo.tts_base_url = ttsBase;
				duo.tts_path = ttsPath;
			} else {
				// Use default for tokens (single words)
				duo.tts_base_url = ttsBase;
				duo.tts_path = ttsPath;
			}

			return this.each(function() {
				$(this).tts_super(d);
			});
		}
	}
}(jQuery));

console.log("Duolingo Tree Enhancer ready");
