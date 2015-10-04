// ==UserScript==
// @name         Duoling Reverse Tree Enhancer
// @namespace    https://github.com/guillaumebrunerie/reversetreeenhancer
// @version      0.1.2
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

/* Stylesheet for the button and the error box */
var css_button_seb = toStyleElem('\
#reverse-tree-enhancer-button { margin-left: 5px; margin-right: 5px; }\
#reverse-tree-enhancer-button.selected { background-color: purple; color: white; border-color: purple; }\
#reverse-tree-enhancer-button.selected:hover { background-color: #A000A0; border-color: #A000A0; }\
\
#sound-error-box { left: 50%; transform: translate(-50%, 0); top: 20px; color: #FF3333; font-weight: bold; }\
#sound-error-box .tooltip-inner { color: #FF3333; font-weight: bold; }');

document.head.appendChild(css_button_seb);

/* Stylesheet for the hiding for the multiple-choice questions */
var css_hiding = toStyleElem('\
.list-judge-options.hover-effect:not(.nothiding) .white-label:not(:hover):not(.active) { color: ' + hColor +'; background-color: ' + hColor + '; border-color: ' + hColor + '; } \
.list-judge-options.hover-effect:not(.nothiding) .white-label:not(:hover):not(.active) input[type=checkbox] { display: none; } \
\
.select-images.hover-effect:not(.nothiding)>li:not(:hover):not(.selected) { color: ' + hColor +'; background-color: ' + hColor + '; border-color: ' + hColor + '; } \
.select-images.hover-effect:not(.nothiding)>li:not(:hover):not(.selected) input[type=radio] { display: none; } \
.select-images.hover-effect:not(.nothiding)>li:not(:hover):not(.selected) .select-images-frame { opacity: 0; }')

function addCSSHiding() {
    document.head.appendChild(css_hiding);
}

function removeCSSHiding() {
    document.head.removeChild(css_hiding);
}

/* Sound Error box */
var soundErrorBox = document.createElement('div');
soundErrorBox.className = "tooltip top"
soundErrorBox.id = "sound-error-box"
var innerSoundErrorBox = document.createElement('div');
innerSoundErrorBox.className = "tooltip-inner"
innerSoundErrorBox.innerHTML = 'Error when loading the sound, click <a id="sound-error-link" target="_blank">here</a> and try to fix the problem.'
soundErrorBox.appendChild(innerSoundErrorBox)

function hideSoundErrorBox() {
    soundErrorBox.style.display = "none";
}

function displaySoundErrorBox(url) {
    var container = document.getElementsByClassName("player-container")[0];
    container.insertBefore(soundErrorBox, container.firstChild);
    document.getElementById("sound-error-link").href = url;
    soundErrorBox.style.display = "";
}

/* Audio functions */

var audio;
var counter = 0;
soundManager.onerror = function(){displaySoundErrorBox(audio.src);}

function playSound(url) {
    console.debug(url);
    counter = counter + 1;
    audio = soundManager.createSound({id: "sound-" + counter, url: url, autoPlay: true});
}

function say(sentence) {
    console.debug("Reverse Tree Enhancer: saying " + sentence);
    playSound("http://translate.google.com/translate_tts?tl=" + targetLang + "&q=" + sentence);
}

function keyUpHandler(e) {    
    if (e.shiftKey && e.keyCode == 32 && audio) {
        audio.stop().play();
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
function challengeTranslateTarget(challenge){
    var cell = challenge.getElementsByClassName("text-to-translate")[0];
    if(grade.children.length === 0){
        sayCell(cell);
        cell.style.color = hColor;
        cell.style.backgroundColor = hColor;
        cell.getElementsByTagName("bdi")[0].style.display = "none";
    } else {
        cell.style.color = "";
        cell.style.backgroundColor = "";
        cell.getElementsByTagName("bdi")[0].style.display = "";
    }
}

/* Translation from source language (eg. English) */
function challengeTranslateSource(challenge){
    if(grade.children.length > 0){
        var betterAnswer = grade.getElementsByTagName("h1")[0].getElementsByTagName("span")
        
        if(betterAnswer.length == 0){
            say(document.getElementById("submitted-text").textContent);
        } else {
            say(betterAnswer[0].textContent);
        }
    }
}

/* Multiple-choice translation question */
function challengeJudge(challenge){
    var textCell = challenge.getElementsByClassName("col-left")[0].getElementsByTagName("bdi")[0]
    var ul = challenge.getElementsByTagName("ul")[0]
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

var quotMark = /["“”]/

/* Select the correct image */
function challengeSelect(challenge){
    var hone = challenge.getElementsByTagName("h1")[0]
    var ul = challenge.getElementsByTagName("ul")[0]
    if(grade.children.length === 0){
        hone.innerHTML = hone.textContent.split(quotMark)[0] + "<span>“" + hone.textContent.split(quotMark)[1] + "”</span>";
        var span = hone.getElementsByTagName("span")[0];
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
function challengeName(challenge){
    var lis = challenge.getElementsByTagName("li")
    var hone = challenge.getElementsByTagName("h1")[0]
    if(grade.children.length === 0){
        hone.innerHTML = hone.textContent.split(quotMark)[0] + "<span>“" + hone.textContent.split(quotMark)[1] + "”</span>";
        var span = hone.getElementsByTagName("span")[0];
        say(span.textContent);
        span.style.color = hColor;
        span.style.backgroundColor = hColor;
        for(var i=0; i < lis.length; i++){
            lis[i].style.backgroundColor = hColor;
            lis[i].dataset.oldImage = lis[i].style.backgroundImage;
            lis[i].style.backgroundImage = "";
        }
    } else {
        var span = hone.getElementsByTagName("span")[0];
        span.style.color = "";
        span.style.backgroundColor = "";

        for(var i=0; i < lis.length; i++){
            lis[i].style.backgroundImage = lis[i].dataset.oldImage;
        }
    }
}

/* Multiple-choice question where we have to choose a word in the source language. Those are useless exercices, but we can’t get rid of them. */
function challengeForm(challenge){
    if(grade.children.length != 0){
        say(grade.getElementsByTagName("h2")[0].children[1].textContent)
    }
}

/* Function dealing with the button on the home page */

function updateButton() {
    var button = document.getElementById("reverse-tree-enhancer-button");
    if(localStorage.getItem("reverse_tree_enhancer_" + document.body.lang) === null) {
        button.textContent = "Is this a reverse tree?";
        button.className = "btn btn-standard right btn-store";
    } else {
        button.textContent = "This is a reverse tree!";
        button.className = "btn btn-standard right btn-store selected";
    } 
}

function toggleLang() {
    var item = "reverse_tree_enhancer_" + document.body.lang
    if(localStorage.getItem(item) === null) {
        localStorage.setItem(item, "yes");
    } else {
        localStorage.removeItem(item);
    };
    updateButton();
}


/* Function dispatching the changes in the page to the other functions */

var oldclass = "";
var targetLang;

function onChange(mutations) {
    var newclass = document.getElementById("app").className;
    if(newclass != oldclass){
        oldclass = newclass;
        
        if(/home/.test(newclass)){
            if(!document.getElementById("reverse-tree-enhancer-button")){
                var tree = document.getElementsByClassName("tree")[0];
                var button = document.createElement("button");
                button.id = "reverse-tree-enhancer-button";
                button.onclick = toggleLang;
                tree.insertBefore(button, tree.firstChild);
            }
            updateButton();
        }
        hideSoundErrorBox();
        
        if(localStorage.getItem("reverse_tree_enhancer_" + document.body.lang) === null) {
            targetLang = "";
            removeCSSHiding();
            return;
        }
        targetLang = document.body.lang;
        addCSSHiding();
        
        var sec = document.getElementById("session-element-container");
        if(!sec){return;}
        var challenge = sec.children[0];
        if(/translate/.test(newclass)){
            if (challenge.getElementsByTagName("textarea")[0].getAttribute("lang") == targetLang){
                challengeTranslateSource(challenge);
            } else {
                challengeTranslateTarget(challenge);
            }
        }
        if(/judge/.test(newclass)){
            challengeJudge(challenge);
        }
        if(/select/.test(newclass)){
            challengeSelect(challenge);
        }
        if(/name/.test(newclass)){
            challengeName(challenge);
        }
        if(/form/.test(newclass)){
            challengeForm(challenge);
        }
    }
}

new MutationObserver(onChange).observe(document.body, {attributes: true, childList: true, subtree: true});
