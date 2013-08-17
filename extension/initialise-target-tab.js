function inspect(object) {
  return JSON.stringify(object);
}

var styleSheets = new STYLE_ADJUSTER.StyleSheets(document.styleSheets);

function handleStyleSheetsRequests() {
  chrome.runtime.onMessage.addListener(function(request, sender, handleResult) {
    console.log("runtime message " + inspect(request));
    var requestType = request.type;
    if(styleSheets.public[requestType]) {
      styleSheets[requestType](request, handleResult);
      return true;
    }
  });
}

function createPopupWindowViaChromeRuntime() {
  chrome.runtime.sendMessage({type: "openPopupWindow"}, 
                             function(response) {
                               console.log("chromeWindowsCreate, response = " + inspect(response));
                             });
}

function createPopupWindowDirectly() {
  var popupWindow = window.open('extension/style-adjuster-extension-popup.html','test-popup',
                                'width=800,height=600,top=300,left=300,menubar=0,' + 
                                'status=0,scrollbars=0,location=0,toolbar=0,resizable=1');
  console.log("popupWindow = " + popupWindow);
}

function initialise() {
  if (window.chrome && window.chrome.runtime) {
    console.log("Initialising target tab for chrome extension");
    handleTitleWindowRequests();
    createPopupWindowViaChromeRuntime();
  }
  else {
    console.log("Initialising outside of chrome extension");
    createPopupWindowDirectly();
  }
}

initialise();
