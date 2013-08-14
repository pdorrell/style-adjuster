function callStyleAdjusterPopupCallback() {
  console.log("HELLO from return-jquery-to-opener.js");
  console.log("document.title = " + document.title);
  console.log("$ = " + $);
  console.log("Calling window.opener.styleAdjusterPopupCallback ...");
  window.opener.styleAdjusterPopupCallback($, window);
  console.log("GOODBYE from return-jquery-to-opener.js");
}

