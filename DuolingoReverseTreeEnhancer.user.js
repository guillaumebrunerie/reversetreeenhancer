// ==UserScript==
// @name         Duoling Reverse Tree Enhancer
// @namespace    https://github.com/guillaumebrunerie/reversetreeenhancer
// @version      0.2.3
// @description  Enhance reverse trees by adding a TTS (currently Google Translate) and turning most exercices into listening exercices by hiding the text in the target language.
// @author       Guillaume Brunerie
// @match        https://www.duolingo.com/*
// @downloadURL  https://github.com/guillaumebrunerie/reversetreeenhancer/raw/master/DuolingoReverseTreeEnhancer.user.js
// @grant        none
// ==/UserScript==

console.debug('Duolingo: Reverse Tree Enhancer');

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
function playSound(sentence, slow) {
    var url="";
    for (i = 0; i < sayFunc.length; i++) {
    	console.log("loop " + i);
    	if (sayFunc[i](sentence, targetLang, slow)) {
    		break;
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

// List of supported TTS providers
var sayFunc = [googleSay, yandexSay, baiduSay];


// Say a sentence
function say(sentence) {
    sentence = sentence.replace(/•/g,"");
    console.debug("Reverse Tree Enhancer: saying '" + sentence + "'");
    sentenceGlobal = sentence;
    playSound(sentence, false);
    lastSaidSlow = false;
}

// Repeat las sentece slowly
function sayslow() {
    var sentence = sentenceGlobal;
    console.debug("Reverse Tree Enhancer: saying slowly '" + sentence + "'");
    playSound(sentenceGlobal, true);
    lastSaidSlow = true;
}

function keyUpHandler(e) {
    if (e.shiftKey && e.keyCode == 32 && audio) {
        if (e.altKey) {
            if (lastSaidSlow) {
                audio.stop().play();
            } else {
                sayslow();
            }
        } else {
            if (lastSaidSlow) {
                say(sentenceGlobal);
            } else {
                audio.stop().play();
            }
        }
    }
}

document.addEventListener('keyup', keyUpHandler, false);

/* jQuery hack to avoid reading things in display:none, copy-pasted from StackOverflow */
function sayCell(cell) {
    var t = $(cell).clone();
    $('body').append(t);
    t.find('*:not(:visible)').remove();
    t.remove();
    say(t.text());
}


/* Functions acting on the various types of exercices */


/* Translation from target language (eg. Polish) */
function challengeTranslateTarget(){
    var cell = challenge.getElementsByClassName("text-to-translate")[0];
    if(grade.children.length === 0){
        sayCell(cell);
        cell.className = "text-to-translate ttt-hide";
        cell.onclick = function(){cell.className = "text-to-translate ttt-not-hide";};
    } else {
        cell.className = "text-to-translate";
        cell.onclick = null
    }
}

/* Translation from source language (eg. English) */
function challengeTranslateSource(){
    if(grade.children.length > 0){
        var betterAnswer = grade.getElementsByTagName("h1")[0].getElementsByTagName("span");
        // Hack for making timed practice work
        var isTimedPractice = (grade.getElementsByClassName("icon-clock-medium").length !== 0);
        var blame = document.getElementById("blame-1")
        var isTypo = blame && blame.offsetParent !== null
        if(isTimedPractice && !isTypo){
            betterAnswer = [];
        }
        
        if(betterAnswer.length === 0){
            say(document.getElementById("submitted-text").textContent);
        } else {
            say(betterAnswer[0].textContent);
        }
    }
}

/* Multiple-choice translation question */
function challengeJudge(){
    var textCell = challenge.getElementsByClassName("col-left")[0].getElementsByTagName("bdi")[0];
    var ul = challenge.getElementsByTagName("ul")[0];
    if(grade.children.length === 0){
        textCell.style.color = hColor;
        textCell.style.backgroundColor = hColor;
        textCell.style.display = "block";
        
        say(textCell.textContent);
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
        say(span.textContent);
        span.style.color = hColor;
        span.style.backgroundColor = hColor;
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
        say(span.textContent);
        span.style.color = hColor;
        span.style.backgroundColor = hColor;
        for(i=0; i < lis.length; i++){
            lis[i].style.backgroundColor = hColor;
            lis[i].dataset.oldImage = lis[i].style.backgroundImage;
            lis[i].style.backgroundImage = "";
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

/* Multiple-choice question where we have to choose a word in the source language. Those are useless exercices, but we can’t get rid of them. */
function challengeForm(){
    if(grade.children.length !== 0){
        say(grade.getElementsByTagName("h2")[0].children[1].textContent);
    }
}

/* Function dealing with the button on the home page */

function isReverseTree() {
    var reverseTrees = JSON.parse(localStorage.getItem("reverse_trees"));
    if(reverseTrees === null) {
        return false;
    }
    var item = duo.user.attributes.ui_language + "-" + duo.user.attributes.learning_language;
    return !!(reverseTrees[item]);
}

function toggleLang() {
    var reverseTrees = JSON.parse(localStorage.getItem("reverse_trees"));
    if(reverseTrees === null) { reverseTrees = {}; }
    var item = duo.user.attributes.ui_language + "-" + duo.user.attributes.learning_language;
    reverseTrees[item] = !reverseTrees[item];
    localStorage.setItem("reverse_trees", JSON.stringify(reverseTrees));
    updateButton();
}

function updateButton() {
    var button = document.getElementById("reverse-tree-enhancer-button");
    if(button === null){ return; }
    if(isReverseTree()) {
        button.textContent = "Reverse tree!";
        button.className = "btn btn-standard right btn-store selected";
    } else {
        button.textContent = "Reverse tree?";
        button.className = "btn btn-standard right btn-store";
    } 
}


/* Function dispatching the changes in the page to the other functions */

var oldclass = "";
var targetLang;
var grade, challenge;

function onChange() {
    var newclass = document.getElementById("app").className;
    
    if(/home/.test(newclass) && !document.getElementById("reverse-tree-enhancer-button")){
        var tree = document.getElementsByClassName("tree")[0];
        var button = document.createElement("button");
        button.id = "reverse-tree-enhancer-button";
        button.onclick = toggleLang;
        tree.insertBefore(button, tree.firstChild);
        updateButton();
    }
    
    if (/slide-session-end/.test(newclass)) {
        // End screen ("you beat the clock...").
        // Destroy the reference to the audio object
        // so that subsequent <S-Space> keypresses
        // don't cause the audio to repeat in, e.g., the tree or discussions.
        audio = null;
    }

    if(newclass != oldclass){
        oldclass = newclass;
        console.debug("New class: " + newclass);

        hideSoundErrorBox();

        if(!isReverseTree()) {
            targetLang = "";
            removeCSSHiding();
            return;
        }
        targetLang = duo.user.attributes.ui_language;
        if(!document.getElementById("timer")) { addCSSHiding(); } else { removeCSSHiding(); }

        var sec = document.getElementById("session-element-container");
        if(!sec){return;}
        challenge = sec.children[0];
        grade = document.getElementById("grade");

        if(/translate/.test(newclass)){
            if (challenge.getElementsByTagName("textarea")[0].getAttribute("lang") == targetLang){
                challengeTranslateSource();
            } else {
                challengeTranslateTarget();
            }
        }
        if(/judge/.test(newclass)){
            challengeJudge();
        }
        if(/select/.test(newclass)){
            challengeSelect();
        }
        if(/name/.test(newclass)){
            challengeName();
        }
        if(/form/.test(newclass)){
            challengeForm();
        }
    }
}

new MutationObserver(onChange).observe(document.body, {attributes: true, childList: true, subtree: true});
