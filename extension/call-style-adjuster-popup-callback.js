console.log("Hello from call-style-adjuster-popup-callback.js");

function callCallback() {
  console.log("callCallback ...");
  console.log("window = " + window);
  console.log("window.opener = " + window.opener);
  if (window.opener) {
    console.log("window.opener.styleAdjusterPopupCallback = " + window.opener.styleAdjusterPopupCallback);
    window.opener.styleAdjusterPopupCallback($, window);
  }
  else {
    console.log("$ = " + $);
    console.log("window = " + window);
    console.log("window.location.search = " + window.location.search);
    var targetDomain = window.location.search.substring(1);
    console.log("targetDomain = " + targetDomain);
    console.log("Posting message to * ...");
    window.postMessage({window: "My window", jquery: ["not really ", "jquery", 23]}, "*");
  }
}

window.onload = callCallback;
